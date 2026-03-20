import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	const backendUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';
	const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? '';

	try {
		const res = await fetch(`${backendUrl}/auth/customer/google`, {
			headers: {
				'Content-Type': 'application/json',
				'x-publishable-api-key': publishableKey,
			},
			method: 'GET',
		});

		const data = await res.json();
		return NextResponse.json(data, { status: res.status });
	} catch (err) {
		console.error('[auth/google] Error:', err);
		return NextResponse.json({ message: 'Server error' }, { status: 500 });
	}
}
