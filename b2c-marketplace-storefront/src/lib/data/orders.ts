'use server';

import type { HttpTypes } from '@medusajs/types';

import { SellerProps } from '@/types/seller';

import { sdk } from '../config';
import medusaError from '../helpers/medusa-error';
import { getAuthHeaders, getCacheOptions } from './cookies';

export const retrieveOrderSet = async (id: string) => {
	const headers = {
		...(await getAuthHeaders()),
	};

	return sdk.client
		.fetch<any>(`/store/order-set/${id}`, {
			cache: 'force-cache',
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
				fields: '*payment_collections.payments,*items,*items.metadata,*items.variant,*items.product,*order_set',
			},
		})
		.then(({ order }) => ({
			...order,
			seller: {
				id: 'default-seller',
				name: 'Marketplace Seller',
				reviews: [],
			},
		}))
		.catch((err) => medusaError(err));
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
				fields: '*items,+items.metadata,*items.variant,*items.product,*reviews,*order_set',
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

	// For now, add a default seller object to each order to prevent the UI error
	// TODO: Implement proper seller data fetching once the SQL join issue is resolved
	const ordersWithSellers = ordersResponse.orders.map((order) => ({
		...order,
		seller: {
			id: 'default-seller',
			name: 'Marketplace Seller',
			reviews: [],
		},
	}));

	return ordersWithSellers;
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
