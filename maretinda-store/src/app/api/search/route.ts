import { type NextRequest, NextResponse } from 'next/server';

import { searchProducts } from '@/lib/data/search';

/** Listings ask through the store, so the backend's key and address stay on the server. */
export async function GET(request: NextRequest) {
	try {
		return NextResponse.json(await searchProducts(request.nextUrl.searchParams.toString()), {
			headers: { 'Cache-Control': 'private, max-age=5' },
		});
	} catch (error) {
		console.error('[search]', (error as Error)?.message);
		return NextResponse.json({ message: "We couldn't load products just now." }, { status: 502 });
	}
}
