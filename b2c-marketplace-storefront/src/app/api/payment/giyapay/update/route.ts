import { type NextRequest, NextResponse } from 'next/server';

import { getAuthHeaders } from '@/lib/data/cookies';

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const backendUrl =
			process.env.NEXT_PUBLIC_BACKEND_URL ||
			process.env.BACKEND_URL ||
			'http://localhost:9000';
		const authHeaders = await getAuthHeaders();
		const publishable =
			process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
			process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY;
		const resp = await fetch(`${backendUrl}/store/giyapay/update`, {
			body: JSON.stringify(body),
			headers: {
				'Content-Type': 'application/json',
				...(authHeaders || {}),
				...(publishable
					? { 'x-publishable-api-key': publishable }
					: {}),
			},
			method: 'POST',
		});
		const data = await resp.json().catch(() => ({}));
		return NextResponse.json(data, { status: resp.status });
	} catch (e: any) {
		return NextResponse.json(
			{ error: 'forward_failed', message: e.message },
			{ status: 500 },
		);
	}
}

export async function GET(req: NextRequest) {
	try {
		const backendUrl =
			process.env.NEXT_PUBLIC_BACKEND_URL ||
			process.env.BACKEND_URL ||
			'http://localhost:9000';
		const url = new URL(req.url);
		const query = Object.fromEntries(url.searchParams.entries()) as any;
		const payload: any = {
			cart_id: query.cart_id || query.cartId,
			description: query.description,
			gateway: (
				query.gateway ||
				query.channel ||
				query.provider ||
				query.payment_method ||
				''
			)
				.toString()
				.toUpperCase(),
			order_id: query.order_id || query.orderId,
			payment_data: query,
			reference_number:
				query.reference_number ||
				query.refno ||
				query.ref ||
				query.referenceNumber,
			vendor_id: query.vendor_id || query.vendorId,
			vendor_name: query.vendor_name || query.vendorName,
		};
		// Enrich vendor info from the order if missing
		if ((!payload.vendor_id || !payload.vendor_name) && payload.order_id) {
			try {
				const authHeaders = await getAuthHeaders();
				const publishable =
					process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
					process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY;
				const orderRes = await fetch(
					`${backendUrl}/store/orders/${payload.order_id}`,
					{
						cache: 'no-store',
						headers: {
							accept: 'application/json',
							...(authHeaders || {}),
							...(publishable
								? { 'x-publishable-api-key': publishable }
								: {}),
						},
					},
				);
				if (orderRes.ok) {
					const data = await orderRes.json().catch(() => ({}) as any);
					const order = (data?.order || data) as any;
					const seller = order?.seller || order?.order?.seller;
					// Prefer member_id to align with vendor panel auth (uses member ids)
					payload.vendor_id =
						payload.vendor_id ||
						seller?.member_id ||
						seller?.id ||
						seller?.seller_id;
					payload.vendor_name =
						payload.vendor_name ||
						seller?.name ||
						seller?.store_name ||
						seller?.store?.name;
				}
			} catch {}
		}
		// Ensure gateway is not blank in UI if provider/method isn't returned by GiyaPay
		if (!payload.gateway) {
			payload.gateway = 'GIYAPAY';
		}
		const authHeaders = await getAuthHeaders();
		const publishable =
			process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
			process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY;
		const resp = await fetch(`${backendUrl}/store/giyapay/update`, {
			body: JSON.stringify(payload),
			headers: {
				'Content-Type': 'application/json',
				...(authHeaders || {}),
				...(publishable
					? { 'x-publishable-api-key': publishable }
					: {}),
			},
			method: 'POST',
		});
		const data = await resp.json().catch(() => ({}));
		return NextResponse.json(data, { status: resp.status });
	} catch (e: any) {
		return NextResponse.json(
			{ error: 'forward_failed', message: e.message },
			{ status: 500 },
		);
	}
}
