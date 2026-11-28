'use server';

import { revalidateTag } from 'next/cache';

import { getAuthHeaders, getCacheTag } from './cookies';

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';

/** A refusal can name the return it is about (code "return_open" or "already_returned"), to link to it. */
type Result<T> = ({ ok: true } & T) | { code?: string; message: string; ok: false; request_id?: string };

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
			return {
				code: json?.code,
				message: json?.message || 'Something went wrong. Please try again.',
				ok: false,
				request_id: json?.request_id,
			};
		}
		if (method === 'POST') revalidateTag(await getCacheTag('orders'));
		return { ok: true, ...(json as T) };
	} catch {
		return { message: 'We could not reach Maretinda. Check your connection and try again.', ok: false };
	}
}

/** The buyer's return request: items and reasons, proof, where to send the refund. */
export const openReturn = async (body: unknown) => call<{ request_id: string }>('POST', '/store/return-cases', body);

/** One of the buyer's returns: where it stands, whether it's still open, and the items it covers. */
export type ReturnCaseSummary = {
	created_at: string;
	items: { line_item_id: string; quantity: number }[];
	open: boolean;
	order_id: string;
	request_id: string;
	stage: string;
	stage_label: string;
};

/** The buyer's returns, newest first; for one order when given. */
export const listReturnCases = async (orderId?: string): Promise<ReturnCaseSummary[]> => {
	const r = await call<{ return_cases: ReturnCaseSummary[] }>(
		'GET',
		`/store/return-cases${orderId ? `?order_id=${encodeURIComponent(orderId)}` : ''}`,
	);
	return r.ok ? r.return_cases : [];
};

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
