import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';

/** Notes that the buyer is leaving for GiyaPay, so a payment that never comes back can be traced. */
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		await fetch(`${BACKEND_URL}/giyapay/attempt`, {
			body: JSON.stringify({ cart_id: body?.cart_id, method: body?.method }),
			cache: 'no-store',
			headers: { 'Content-Type': 'application/json' },
			method: 'POST',
		});
	} catch {
		// Never stands between a buyer and paying
	}
	return NextResponse.json({ ok: true });
}
