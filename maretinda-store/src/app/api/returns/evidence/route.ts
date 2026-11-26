import { NextRequest, NextResponse } from 'next/server';

import { getAuthHeaders } from '@/lib/data/cookies';

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';

/**
 * Passes a return photo or unboxing video to the backend with the buyer's
 * sign-in, streamed rather than through a server action (those stop at 1 MB).
 */
export async function POST(req: NextRequest) {
	const res = await fetch(`${BACKEND_URL}/store/return-evidence`, {
		body: req.body,
		// @ts-expect-error Node's fetch needs this to stream a request body
		duplex: 'half',
		headers: {
			...(await getAuthHeaders()),
			'content-type': req.headers.get('content-type') || '',
			'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
		},
		method: 'POST',
	}).catch(() => null);
	if (!res) return NextResponse.json({ message: 'We could not reach Maretinda. Try again.' }, { status: 502 });
	const json = await res.json().catch(() => ({ message: 'Upload failed. Try again.' }));
	return NextResponse.json(json, { status: res.status });
}
