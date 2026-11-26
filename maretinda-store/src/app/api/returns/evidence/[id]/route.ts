import { NextRequest, NextResponse } from 'next/server';

import { getAuthHeaders } from '@/lib/data/cookies';

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';

/** Shows the buyer a photo or video on their own return. Ranges pass through, so videos can be scrubbed. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const range = req.headers.get('range');
	const res = await fetch(`${BACKEND_URL}/store/return-evidence/${encodeURIComponent(id)}`, {
		cache: 'no-store',
		headers: {
			...(await getAuthHeaders()),
			...(range ? { range } : {}),
			'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
		},
	}).catch(() => null);
	if (!res || !res.ok) return NextResponse.json({ message: 'Not found' }, { status: 404 });
	const headers = new Headers({ 'Cache-Control': 'private, no-store' });
	for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'content-disposition']) {
		const v = res.headers.get(h);
		if (v) headers.set(h, v);
	}
	return new NextResponse(res.body, { headers, status: res.status });
}
