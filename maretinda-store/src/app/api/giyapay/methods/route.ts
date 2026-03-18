import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';

const DEFAULTS = {
	enabledMethods: ['MASTERCARD/VISA', 'GCASH', 'QRPH', 'WECHATPAY', 'UNIONPAY'],
	isEnabled: true,
};

export async function GET() {
	try {
		const res = await fetch(`${BACKEND_URL}/store/giyapay/payment-methods`, {
			cache: 'no-store',
			headers: { 'x-publishable-api-key': PUBLISHABLE_KEY },
		});
		if (!res.ok) return NextResponse.json(DEFAULTS);
		const data = await res.json();
		if (!data.enabledMethods) return NextResponse.json(DEFAULTS);
		return NextResponse.json(data);
	} catch {
		return NextResponse.json(DEFAULTS);
	}
}
