'use server';

import type { HttpTypes } from '@medusajs/types';
import { revalidateTag } from 'next/cache';
import { headers as requestHeaders } from 'next/headers';
import { redirect } from 'next/navigation';

import { forwardedAuthHeaders } from '@/lib/helpers/forwarded-auth';
import { isShopperToken } from '@/lib/helpers/session-token';
import type { LoginResult, SignInAccount, SignUpResult } from '@/types/auth';

import { sdk } from '../config';
import {
	getAuthHeaders,
	getCacheOptions,
	getCacheTag,
	getCartId,
	removeAuthToken,
	removeCartId,
	setAuthToken,
	setCartId,
} from './cookies';

export const retrieveCustomer =
	async (): Promise<HttpTypes.StoreCustomer | null> => {
		const authHeaders = await getAuthHeaders();

		// Signed out: nothing to ask the backend
		if (!('authorization' in authHeaders)) return null;

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
async function customerAuth(
	path: string,
	body: Record<string, string>,
	extraHeaders: Record<string, string> = {},
): Promise<string | undefined> {
	const res = await fetch(`${process.env.MEDUSA_BACKEND_URL}/auth/customer/emailpass${path}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
			...forwardedAuthHeaders(await requestHeaders(), process.env.STORE_SERVER_SECRET),
			...extraHeaders,
		},
		body: JSON.stringify(body),
	});
	if (res.status === 429) {
		throw Object.assign(new Error('Error: Too many attempts. Please wait a few minutes and try again.'), { status: 429 });
	}
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw Object.assign(new Error(`Error: ${err.message ?? res.statusText}`), { status: res.status });
	}
	const data = await res.json().catch(() => ({}));
	return data.token;
}

/** Reads the backend's answer about whose sign-in a token is (see /store/auth/shopper-profile). */
async function shopperProfile(method: 'GET' | 'POST', token: string) {
	const res = await fetch(`${process.env.MEDUSA_BACKEND_URL}/store/auth/shopper-profile`, {
		cache: 'no-store',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
			...forwardedAuthHeaders(await requestHeaders(), process.env.STORE_SERVER_SECRET),
		},
		method,
		...(method === 'POST' ? { body: '{}' } : {}),
	});
	const data = await res.json().catch(() => ({}));
	return { data, status: res.status };
}

/** Signs the shopper in on this device: the session, then the cart they filled here or elsewhere. */
async function startSession(token: string) {
	await setAuthToken(token);
	revalidateTag(await getCacheTag('customers'));
	// They are signed in either way: a cart that can't move must not look like a wrong password
	await transferCart().catch((error) => {
		console.error('[sign-in] cart transfer failed:', error?.message ?? error);
	});
}

const errorText = (error: unknown) => String((error as Error)?.message ?? error ?? '');

export async function signup(formData: FormData): Promise<SignUpResult> {
	const password = formData.get('password') as string;
	const customerForm = {
		email: String(formData.get('email') ?? '').trim().toLowerCase(),
		first_name: formData.get('first_name') as string,
		last_name: formData.get('last_name') as string,
		phone: formData.get('phone') as string,
	};

	try {
		const captcha = formData.get('captcha_token') as string | null;
		const token = await customerAuth(
			'/register',
			{ email: customerForm.email, password: password },
			captcha ? { 'x-captcha-token': captcha } : {},
		);

		// Not kept as the session: until the account exists it opens nothing
		await sdk.store.customer.create(customerForm, {}, { authorization: `Bearer ${token}` });

		const loginToken = await customerAuth('', {
			email: customerForm.email,
			password,
		});
		if (!isShopperToken(loginToken)) return { ok: false, reason: 'failed' };

		await startSession(loginToken as string);
		return { ok: true };
	} catch (error) {
		const message = errorText(error);
		if ((error as { status?: number })?.status === 429) return { ok: false, reason: 'too_many' };
		if (/verification check/i.test(message)) return { ok: false, reason: 'captcha' };
		if (/already (exists|has an account)/i.test(message)) return { ok: false, reason: 'exists' };
		console.error('[sign-up] failed:', message);
		return { ok: false, reason: 'failed' };
	}
}

/**
 * Signs a shopper in. The backend accepts a password whatever kind of account
 * it opens, so a right password can still have no shopper behind it: a
 * seller's, an applicant's, or a sign-up that never finished. The form is told
 * which, and can call this again with `start_shopping` to add a shopper account
 * to that same sign-in.
 */
export async function login(formData: FormData): Promise<LoginResult> {
	const email = String(formData.get('email') ?? '').trim();
	const password = formData.get('password') as string;
	const startShopping = formData.get('start_shopping') === '1';

	try {
		// Sign-ins match the email exactly as it was registered, and phones capitalise
		// the first letter: if that isn't found, try it in lower case
		const token = await customerAuth('', { email, password }).catch((error) => {
			const lower = email.toLowerCase();
			if (error?.status === 401 && lower !== email) return customerAuth('', { email: lower, password });
			throw error;
		});
		if (!token) return { ok: false, reason: 'failed' };

		if (isShopperToken(token)) {
			await startSession(token);
			return { ok: true };
		}

		if (startShopping) {
			const { data, status } = await shopperProfile('POST', token);
			if (status === 200 && isShopperToken(data.token)) {
				await startSession(data.token);
				return { ok: true };
			}
			if (status === 429) return { ok: false, reason: 'too_many' };
			return { ok: false, reason: data.code === 'existing_shopper' ? 'existing_shopper' : 'failed' };
		}

		const { data, status } = await shopperProfile('GET', token);
		if (status !== 200) return { ok: false, reason: 'failed' };
		return { account: data as SignInAccount, ok: false, reason: 'no_shopper_account' };
	} catch (error) {
		const status = (error as { status?: number })?.status;
		if (status === 429) return { ok: false, reason: 'too_many' };
		if (status === 401 || status === 400) return { ok: false, reason: 'invalid' };
		// Not their password: the backend is down or slow, so don't say it was
		console.error('[sign-in] failed:', errorText(error));
		return { ok: false, reason: 'failed' };
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

/**
 * Deletes the signed-in buyer's account. The backend refuses while an order
 * is still on its way; its message is shown as is. On success the buyer is
 * signed out here and the caller sends them home.
 */
export async function deleteAccount(): Promise<{
	success: boolean;
	error?: string;
}> {
	try {
		await sdk.client.fetch('/store/account', {
			headers: await getAuthHeaders(),
			method: 'DELETE',
		});
	} catch (error: any) {
		return {
			error: error?.message || "We couldn't delete your account. Please try again.",
			success: false,
		};
	}

	await removeAuthToken();
	await removeCartId();
	revalidateTag(await getCacheTag('customers'));
	revalidateTag(await getCacheTag('carts'));
	return { success: true };
}

/**
 * On sign-in: a cart filled on this device becomes the buyer's. If this
 * device's cart is empty, the cart they left on another device comes back.
 */
export async function transferCart() {
	const cartId = await getCartId();
	const headers = await getAuthHeaders();

	const itemsHere = cartId
		? await sdk.client
				.fetch<{ cart: HttpTypes.StoreCart }>(`/store/carts/${cartId}`, {
					headers,
					query: { fields: 'id,items.id' },
				})
				.then(({ cart }) => cart?.items?.length ?? 0)
				.catch(() => 0)
		: 0;

	if (cartId && itemsHere > 0) {
		await sdk.store.cart.transferCart(cartId, {}, headers);
	} else {
		const { cart_id } = await sdk.client
			.fetch<{ cart_id: string | null }>('/store/account/cart', { headers })
			.catch(() => ({ cart_id: null }));
		if (cart_id) await setCartId(cart_id);
	}

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
		.then(async (response) => {
			// fetch only rejects when the server can't be reached: an expired or
			// used link answers 401, and must not be reported as a new password
			if (!response.ok) {
				return {
					error:
						response.status === 401
							? 'This reset link has expired or was already used. Please ask for a new one.'
							: "We couldn't update your password. Please try again.",
					success: false,
				};
			}
			await removeAuthToken();
			const customerCacheTag = await getCacheTag('customers');
			revalidateTag(customerCacheTag);
			return { error: null, success: true };
		})
		.catch(() => {
			return { error: "We couldn't reach the server. Please try again.", success: false };
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
