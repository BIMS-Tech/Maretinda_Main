'use server';

import type { HttpTypes } from '@medusajs/types';
import { revalidateTag } from 'next/cache';
import { headers as requestHeaders } from 'next/headers';
import { redirect } from 'next/navigation';

import { forwardedAuthHeaders } from '@/lib/helpers/forwarded-auth';

import { sdk } from '../config';
import {
	getAuthHeaders,
	getCacheOptions,
	getCacheTag,
	getCartId,
	removeAuthToken,
	removeCartId,
	setAuthToken,
} from './cookies';

export const retrieveCustomer =
	async (): Promise<HttpTypes.StoreCustomer | null> => {
		const authHeaders = await getAuthHeaders();

		if (!authHeaders) return null;

		const headers = {
			...authHeaders,
		};

		const next = {
			...(await getCacheOptions('customers')),
		};

		return await sdk.client
			.fetch<{ customer: HttpTypes.StoreCustomer }>(
				`/store/customers/me`,
				{
					cache: 'no-store',
					headers,
					method: 'GET',
					next,
					query: {
						fields: '*orders',
					},
				},
			)
			.then(({ customer }) => customer)
			.catch(() => null);
	};

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
	const headers = {
		...(await getAuthHeaders()),
	};

	const updateRes = await sdk.store.customer
		.update(body, {}, headers)
		.then(({ customer }) => customer)
		.catch((err) => {
			throw new Error(err.message);
		});

	const cacheTag = await getCacheTag('customers');
	revalidateTag(cacheTag);

	return updateRes;
};

/**
 * Calls a customer auth route with the buyer's address passed on (see
 * forwardedAuthHeaders), so rate limits apply per buyer, not to the whole store.
 * Errors start with "Error" like the SDK's, which the forms look for.
 */
async function customerAuth(path: string, body: Record<string, string>): Promise<string | undefined> {
	const res = await fetch(`${process.env.MEDUSA_BACKEND_URL}/auth/customer/emailpass${path}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
			...forwardedAuthHeaders(await requestHeaders(), process.env.STORE_SERVER_SECRET),
		},
		body: JSON.stringify(body),
	});
	if (res.status === 429) throw new Error('Error: Too many attempts. Please wait a few minutes and try again.');
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(`Error: ${err.message ?? res.statusText}`);
	}
	const data = await res.json().catch(() => ({}));
	return data.token;
}

export async function signup(formData: FormData) {
	const password = formData.get('password') as string;
	const customerForm = {
		email: formData.get('email') as string,
		first_name: formData.get('first_name') as string,
		last_name: formData.get('last_name') as string,
		phone: formData.get('phone') as string,
	};

	try {
		const token = await customerAuth('/register', {
			email: customerForm.email,
			password: password,
		});

		await setAuthToken(token as string);

		const headers = {
			...(await getAuthHeaders()),
		};

		const { customer: createdCustomer } = await sdk.store.customer.create(
			customerForm,
			{},
			headers,
		);

		const loginToken = await customerAuth('', {
			email: customerForm.email,
			password,
		});

		await setAuthToken(loginToken as string);

		const customerCacheTag = await getCacheTag('customers');
		revalidateTag(customerCacheTag);

		await transferCart();

		return createdCustomer;
	} catch (error: any) {
		return error.toString();
	}
}

export async function login(formData: FormData) {
	const email = formData.get('email') as string;
	const password = formData.get('password') as string;

	try {
		await customerAuth('', { email, password })
			.then(async (token) => {
				await setAuthToken(token as string);
				const customerCacheTag = await getCacheTag('customers');
				revalidateTag(customerCacheTag);
			});
	} catch (error: any) {
		return error.toString();
	}

	try {
		await transferCart();
	} catch (error: any) {
		return error.toString();
	}
}

export async function signout() {
	await sdk.auth.logout();

	await removeAuthToken();

	const customerCacheTag = await getCacheTag('customers');
	revalidateTag(customerCacheTag);

	await removeCartId();

	const cartCacheTag = await getCacheTag('carts');
	revalidateTag(cartCacheTag);
	redirect(`/`);
}

export async function transferCart() {
	const cartId = await getCartId();

	if (!cartId) {
		return;
	}

	const headers = await getAuthHeaders();

	await sdk.store.cart.transferCart(cartId, {}, headers);

	const cartCacheTag = await getCacheTag('carts');
	revalidateTag(cartCacheTag);
}

export const addCustomerAddress = async (formData: FormData): Promise<any> => {
	const address = {
		address_1: formData.get('address_1') as string,
		address_2: formData.get('address_2') as string,
		address_name: formData.get('address_name') as string,
		city: formData.get('city') as string,
		company: formData.get('company') as string,
		country_code: formData.get('country_code') as string,
		first_name: formData.get('first_name') as string,
		is_default_billing: Boolean(formData.get('isDefaultBilling')),
		is_default_shipping: Boolean(formData.get('isDefaultShipping')),
		last_name: formData.get('last_name') as string,
		phone: formData.get('phone') as string,
		postal_code: formData.get('postal_code') as string,
		province: formData.get('province') as string,
	};

	const headers = {
		...(await getAuthHeaders()),
	};

	return sdk.store.customer
		.createAddress(address, {}, headers)
		.then(async ({ customer }) => {
			const customerCacheTag = await getCacheTag('customers');
			revalidateTag(customerCacheTag);
			return { error: null, success: true };
		})
		.catch((err) => {
			return { error: err.toString(), success: false };
		});
};

export const deleteCustomerAddress = async (
	addressId: string,
): Promise<void> => {
	const headers = {
		...(await getAuthHeaders()),
	};

	await sdk.store.customer
		.deleteAddress(addressId, headers)
		.then(async () => {
			const customerCacheTag = await getCacheTag('customers');
			revalidateTag(customerCacheTag);
			return { error: null, success: true };
		})
		.catch((err) => {
			return { error: err.toString(), success: false };
		});
};

export const updateCustomerAddress = async (
	formData: FormData,
): Promise<any> => {
	const addressId = formData.get('addressId') as string;

	if (!addressId) {
		return { error: 'Address ID is required', success: false };
	}

	const address = {
		address_1: formData.get('address_1') as string,
		address_2: formData.get('address_2') as string,
		address_name: formData.get('address_name') as string,
		city: formData.get('city') as string,
		company: formData.get('company') as string,
		country_code: formData.get('country_code') as string,
		first_name: formData.get('first_name') as string,
		last_name: formData.get('last_name') as string,
		postal_code: formData.get('postal_code') as string,
		province: formData.get('province') as string,
	} as HttpTypes.StoreUpdateCustomerAddress;

	const phone = formData.get('phone') as string;

	if (phone) {
		address.phone = phone;
	}

	const headers = {
		...(await getAuthHeaders()),
	};

	return sdk.store.customer
		.updateAddress(addressId, address, {}, headers)
		.then(async () => {
			const customerCacheTag = await getCacheTag('customers');
			revalidateTag(customerCacheTag);
			return { error: null, success: true };
		})
		.catch((err) => {
			return { error: err.toString(), success: false };
		});
};

export const updateCustomerPassword = async (
	password: string,
	token: string,
): Promise<any> => {
	const res = await fetch(
		`${process.env.MEDUSA_BACKEND_URL}/auth/customer/emailpass/update`,
		{
			body: JSON.stringify({ password }),
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			method: 'POST',
		},
	)
		.then(async () => {
			await removeAuthToken();
			const customerCacheTag = await getCacheTag('customers');
			revalidateTag(customerCacheTag);
			return { error: null, success: true };
		})
		.catch((err: any) => {
			return { error: err.toString(), success: false };
		});

	return res;
};

export const sendResetPasswordEmail = async (email: string) => {
	const res = await customerAuth('/reset-password', { identifier: email })
		.then(() => {
			return { error: null, success: true };
		})
		.catch((err: any) => {
			return { error: err.toString(), success: false };
		});

	return res;
};
