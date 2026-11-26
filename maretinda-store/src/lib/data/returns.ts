'use server';

import { revalidateTag } from 'next/cache';

import { getAuthHeaders, getCacheTag } from './cookies';

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';

type Result<T> = ({ ok: true } & T) | { message: string; ok: false };

async function call<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<Result<T>> {
	try {
		const res = await fetch(`${BACKEND_URL}${path}`, {
			body: body === undefined ? undefined : JSON.stringify(body),
			cache: 'no-store',
			headers: {
				...(await getAuthHeaders()),
				'Content-Type': 'application/json',
				'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
			},
			method,
		});
		const json = await res.json().catch(() => ({}));
		if (!res.ok) {
			return { message: json?.message || 'Something went wrong. Please try again.', ok: false };
		}
		if (method === 'POST') revalidateTag(await getCacheTag('orders'));
		return { ok: true, ...(json as T) };
	} catch {
		return { message: 'We could not reach Maretinda. Check your connection and try again.', ok: false };
	}
}

/** The buyer's return request: items and reasons, proof, where to send the refund. */
export const openReturn = async (body: unknown) => call<{ request_id: string }>('POST', '/store/return-cases', body);

export const getReturnCase = async (id: string) =>
	call<{ return_case: any }>('GET', `/store/return-cases/${encodeURIComponent(id)}`);

export const markReturnShipped = async (id: string, body: { courier: string; fee: string; tracking_number: string }) =>
	call<{ stage: string }>('POST', `/store/return-cases/${encodeURIComponent(id)}/shipped`, body);

export const escalateReturn = async (id: string, note: string) =>
	call<{ stage: string }>('POST', `/store/return-cases/${encodeURIComponent(id)}/escalate`, { note });

export const requestCancellation = async (body: unknown) => call<{ id: string }>('POST', '/store/cancellation-requests', body);

export const getOrderRefunds = async (orderId: string) =>
	call<{ cancellation: any; refunds: any[]; returns: { request_id: string; stage: string }[] }>(
		'GET',
		`/store/account/orders/${encodeURIComponent(orderId)}/refunds`,
	);

export const addRefundAccount = async (refundId: string, payout: unknown) =>
	call<{ payout_label: string }>('POST', `/store/refunds/${encodeURIComponent(refundId)}/payout`, { payout });
