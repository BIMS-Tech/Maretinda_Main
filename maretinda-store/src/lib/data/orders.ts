'use server';

import type { HttpTypes } from '@medusajs/types';
import { revalidateTag } from 'next/cache';

import { SellerProps } from '@/types/seller';

import { sdk } from '../config';
import medusaError from '../helpers/medusa-error';
import { getAuthHeaders, getCacheOptions, getCacheTag } from './cookies';

// Every order belongs to one seller. The UI reads order.seller for the shop
// name, the return address and the seller review, so always hand it an object.
const withSeller = <T extends object>(order: T) => ({
	...order,
	seller: {
		reviews: [] as any[],
		...((order as { seller?: SellerProps }).seller ?? {
			id: '',
			name: 'Seller',
		}),
	},
});

export const retrieveOrderSet = async (id: string) => {
	const headers = {
		...(await getAuthHeaders()),
	};

	return sdk.client
		.fetch<any>(`/store/order-set/${id}`, {
			// Order status (fulfillment_status) changes on the backend when the
			// seller marks the order shipped/delivered. force-cache here pinned the
			// page to the first snapshot (e.g. "Received") forever, so always fetch
			// fresh — matching listOrders, which uses no-cache for the same reason.
			cache: 'no-cache',
			headers,
			method: 'GET',
		})
		.then(({ order_set }) => order_set)
		.catch((err) => medusaError(err));
};

export const retrieveOrder = async (id: string) => {
	const headers = {
		...(await getAuthHeaders()),
	};

	const next = {
		...(await getCacheOptions('orders')),
	};

	return sdk.client
		.fetch<HttpTypes.StoreOrderResponse>(`/store/orders/${id}`, {
			cache: 'force-cache',
			headers,
			method: 'GET',
			next,
			query: {
				fields: '*payment_collections.payments,*items,+items.subtotal,+item_subtotal,+items.thumbnail,*items.metadata,*items.variant,*items.product,+items.product.thumbnail,*order_set,*seller',
			},
		})
		.then(({ order }) => withSeller(order))
		.catch((err) => medusaError(err));
};

/** Cancels the signed-in buyer's own order; the message says why when it can't be. */
export const cancelOrder = async (
	id: string,
): Promise<{ ok: true } | { ok: false; message: string }> => {
	const headers = {
		...(await getAuthHeaders()),
		'Content-Type': 'application/json',
		'x-publishable-api-key': process.env
			.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
	};
	try {
		const res = await fetch(
			`${process.env.MEDUSA_BACKEND_URL}/store/account/orders/${id}/cancel`,
			{ headers, method: 'POST' },
		);
		if (res.ok) {
			revalidateTag(await getCacheTag('orders'));
			return { ok: true };
		}
		const body = await res.json().catch(() => null);
		return {
			message:
				body?.message ||
				'We could not cancel this order. Please try again.',
			ok: false,
		};
	} catch {
		return {
			message: 'We could not reach the server. Please try again.',
			ok: false,
		};
	}
};

export const createReturnRequest = async (data: any) => {
	const headers = {
		...(await getAuthHeaders()),
		'Content-Type': 'application/json',
		'x-publishable-api-key': process.env
			.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
	};

	const response = await fetch(
		`${process.env.MEDUSA_BACKEND_URL}/store/return-request`,
		{
			body: JSON.stringify(data),
			headers,
			method: 'POST',
		},
	)
		.then((res) => res)
		.catch((err) => medusaError(err));

	return response.json();
};

export const getReturns = async () => {
	const headers = await getAuthHeaders();

	return sdk.client
		.fetch<{
			order_return_requests: Array<any>;
		}>(`/store/return-request`, {
			cache: 'force-cache',
			headers,
			method: 'GET',
		})
		.then((res) => res)
		.catch((err) => medusaError(err));
};

export const retriveReturnMethods = async (order_id: string) => {
	const headers = await getAuthHeaders();

	return sdk.client
		.fetch<{
			shipping_options: Array<any>;
		}>(`/store/shipping-options/return?order_id=${order_id}`, {
			cache: 'force-cache',
			headers,
			method: 'GET',
		})
		.then(({ shipping_options }) => shipping_options)
		.catch(() => []);
};

export const listOrders = async (
	limit: number = 10,
	offset: number = 0,
	filters?: Record<string, any>,
) => {
	const headers = {
		...(await getAuthHeaders()),
	};

	const next = {
		...(await getCacheOptions('orders')),
	};

	// First, fetch orders without seller data to avoid SQL errors
	const ordersResponse = await sdk.client
		.fetch<{
			orders: Array<HttpTypes.StoreOrder & { reviews: any[] }>;
		}>(`/store/orders`, {
			cache: 'no-cache',
			headers,
			method: 'GET',
			next,
			query: {
				fields: '*items,+items.metadata,*items.variant,*items.product,*reviews,*order_set,*seller',
				limit,
				offset,
				order: '-created_at',
				...filters,
			},
		})
		.catch((err) => medusaError(err));

	if (!ordersResponse?.orders) {
		return [];
	}

	return ordersResponse.orders.map(withSeller);
};

export const createTransferRequest = async (
	state: {
		success: boolean;
		error: string | null;
		order: HttpTypes.StoreOrder | null;
	},
	formData: FormData,
): Promise<{
	success: boolean;
	error: string | null;
	order: HttpTypes.StoreOrder | null;
}> => {
	const id = formData.get('order_id') as string;

	if (!id) {
		return { error: 'Order ID is required', order: null, success: false };
	}

	const headers = await getAuthHeaders();

	return await sdk.store.order
		.requestTransfer(
			id,
			{},
			{
				fields: 'id, email',
			},
			headers,
		)
		.then(({ order }) => ({ error: null, order, success: true }))
		.catch((err) => ({ error: err.message, order: null, success: false }));
};

export const acceptTransferRequest = async (id: string, token: string) => {
	const headers = await getAuthHeaders();

	return await sdk.store.order
		.acceptTransfer(id, { token }, {}, headers)
		.then(({ order }) => ({ error: null, order, success: true }))
		.catch((err) => ({ error: err.message, order: null, success: false }));
};

export const declineTransferRequest = async (id: string, token: string) => {
	const headers = await getAuthHeaders();

	return await sdk.store.order
		.declineTransfer(id, { token }, {}, headers)
		.then(({ order }) => ({ error: null, order, success: true }))
		.catch((err) => ({ error: err.message, order: null, success: false }));
};

export const retrieveReturnReasons = async () => {
	const headers = await getAuthHeaders();

	return sdk.client
		.fetch<{
			return_reasons: Array<HttpTypes.StoreReturnReason>;
		}>(`/store/return-reasons`, {
			cache: 'force-cache',
			headers,
			method: 'GET',
		})
		.then(({ return_reasons }) => return_reasons)
		.catch((err) => medusaError(err));
};
