import { NextRequest, NextResponse } from 'next/server';

import { getAuthHeaders } from '@/lib/data/cookies';

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';

/** Hands the signed-in buyer the invoice PDF for one of their own orders. */
export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const res = await fetch(
		`${BACKEND_URL}/store/account/orders/${encodeURIComponent(id)}/invoice`,
		{
			cache: 'no-store',
			headers: {
				...(await getAuthHeaders()),
				'x-publishable-api-key': PUBLISHABLE_KEY,
			},
		},
	);
	if (!res.ok) {
		return NextResponse.json(
			{ message: res.status === 401 ? 'Please sign in to download this invoice.' : 'This invoice is not available.' },
			{ status: res.status === 401 ? 401 : 404 },
		);
	}
	return new NextResponse(res.body, {
		headers: {
			'Cache-Control': 'private, no-store',
			'Content-Disposition': res.headers.get('content-disposition') || 'attachment; filename="invoice.pdf"',
			'Content-Type': 'application/pdf',
		},
	});
}
