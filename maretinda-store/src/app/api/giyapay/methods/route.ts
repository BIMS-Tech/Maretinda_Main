import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';

export async function GET() {
	try {
		const res = await fetch(`${BACKEND_URL}/store/giyapay/payment-methods`, {
			cache: 'no-store',
		});
		const data = await res.json();
		return NextResponse.json(data);
	} catch {
		return NextResponse.json({
			enabledMethods: ['MASTERCARD/VISA', 'GCASH', 'QRPH', 'WECHATPAY', 'UNIONPAY'],
			isEnabled: true,
		});
	}
}
