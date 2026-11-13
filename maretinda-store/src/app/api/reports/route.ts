import { type NextRequest, NextResponse } from 'next/server';

import { forwardedAuthHeaders } from '@/lib/helpers/forwarded-auth';

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';

/** Passes a buyer's report of a product or shop to the backend. */
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const res = await fetch(`${BACKEND_URL}/store/reports`, {
			body: JSON.stringify({
				comment: body?.comment,
				email: body?.email,
				kind: body?.kind,
				reason: body?.reason,
				target: body?.target,
			}),
			cache: 'no-store',
			headers: {
				'Content-Type': 'application/json',
				'x-publishable-api-key': PUB_KEY,
				...forwardedAuthHeaders(req.headers, process.env.STORE_SERVER_SECRET),
			},
			method: 'POST',
		});
		const json = await res.json().catch(() => ({}));
		return NextResponse.json(json, { status: res.status });
	} catch {
		return NextResponse.json(
			{ message: 'We could not send your report. Please try again.' },
			{ status: 502 },
		);
	}
}
