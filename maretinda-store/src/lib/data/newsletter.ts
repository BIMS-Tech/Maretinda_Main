'use server';

import { headers as requestHeaders } from 'next/headers';

import { forwardedAuthHeaders } from '@/lib/helpers/forwarded-auth';

/**
 * Signs an email up to the newsletter. The buyer's address is passed on so
 * the backend's sign-up limit applies per buyer, not to the whole store.
 */
export async function subscribeToNewsletter(
	email: string,
): Promise<{ ok: boolean; message?: string }> {
	try {
		const res = await fetch(
			`${process.env.MEDUSA_BACKEND_URL}/store/newsletter`,
			{
				body: JSON.stringify({ email }),
				headers: {
					'Content-Type': 'application/json',
					'x-publishable-api-key': process.env
						.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
					...forwardedAuthHeaders(
						await requestHeaders(),
						process.env.STORE_SERVER_SECRET,
					),
				},
				method: 'POST',
			},
		);
		if (res.ok) return { ok: true };
		if (res.status === 429)
			return {
				message: 'Too many sign-ups. Please try again later.',
				ok: false,
			};
		const data = await res.json().catch(() => ({}));
		return {
			message:
				data.message || "We couldn't sign you up. Please try again.",
			ok: false,
		};
	} catch {
		return {
			message: "We couldn't sign you up. Please try again.",
			ok: false,
		};
	}
}
