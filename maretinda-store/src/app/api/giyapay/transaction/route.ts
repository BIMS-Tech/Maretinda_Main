import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';

export async function GET(req: NextRequest) {
	const orderId = req.nextUrl.searchParams.get('order_id');
	if (!orderId) {
		return NextResponse.json({ error: 'order_id is required' }, { status: 400 });
	}

	try {
		const res = await fetch(
			`${BACKEND_URL}/store/giyapay/transaction?order_id=${orderId}`,
			{
				cache: 'no-store',
				headers: { 'x-publishable-api-key': PUBLISHABLE_KEY },
			},
		);
		if (!res.ok) {
			return NextResponse.json({ error: 'Transaction not found' }, { status: res.status });
		}
		const data = await res.json();
		return NextResponse.json(data);
	} catch {
		return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 });
	}
}
