'use server';

import { headers as requestHeaders } from 'next/headers';

import { forwardedAuthHeaders } from '@/lib/helpers/forwarded-auth';

import { sdk } from '../config';
import { getAuthHeaders } from './cookies';

/** The buyer's own address, so the backend's rate limits apply per buyer, not to the whole store. */
const buyerAddress = async () =>
	forwardedAuthHeaders(
		await requestHeaders(),
		process.env.STORE_SERVER_SECRET,
	);

export type EmailVerification = {
	email: string | null;
	required: boolean;
	verified: boolean;
};

const messageOf = (error: unknown, fallback: string) =>
	error instanceof Error && error.message ? error.message : fallback;

/** Whether the signed-in buyer has confirmed their email. Null when signed out. */
export async function getEmailVerification(): Promise<EmailVerification | null> {
	const headers = await getAuthHeaders();
	if (!('authorization' in headers)) return null;
	try {
		return await sdk.client.fetch<EmailVerification>(
			'/store/email-verification',
			{ cache: 'no-store', headers },
		);
	} catch {
		return null;
	}
}

/** Sends the signed-in buyer a fresh confirmation link. */
export async function resendEmailVerification(): Promise<{
	message: string;
	ok: boolean;
	verified?: boolean;
}> {
	const headers = await getAuthHeaders();
	try {
		const res = await sdk.client.fetch<{
			email: string | null;
			sent: boolean;
			verified: boolean;
		}>('/store/email-verification/resend', {
			body: {},
			headers: { ...headers, ...(await buyerAddress()) },
			method: 'POST',
		});
		if (res.verified) {
			return {
				message: 'Your email is already confirmed.',
				ok: true,
				verified: true,
			};
		}
		return res.sent
			? {
					message: `We sent a new link to ${res.email}. Check your inbox and spam folder.`,
					ok: true,
				}
			: {
					message:
						"We couldn't send the email just now. Please try again in a few minutes.",
					ok: false,
				};
	} catch (error) {
		return {
			message: messageOf(
				error,
				'Something went wrong. Please try again.',
			),
			ok: false,
		};
	}
}

/** Uses the link from the confirmation email. */
export async function confirmEmail(token: string): Promise<{
	already?: boolean;
	email?: string;
	kind?: 'customer' | 'seller_application';
	message: string;
	ok: boolean;
}> {
	try {
		const res = await sdk.client.fetch<{
			already: boolean;
			email: string;
			kind: 'customer' | 'seller_application';
		}>('/store/email-verification/confirm', {
			body: { token },
			headers: await buyerAddress(),
			method: 'POST',
		});
		return {
			already: res.already,
			email: res.email,
			kind: res.kind,
			message: res.already
				? `${res.email} was already confirmed.`
				: `Thanks! ${res.email} is confirmed.`,
			ok: true,
		};
	} catch (error) {
		return {
			message: messageOf(
				error,
				"We couldn't confirm your email. Please try again.",
			),
			ok: false,
		};
	}
}
