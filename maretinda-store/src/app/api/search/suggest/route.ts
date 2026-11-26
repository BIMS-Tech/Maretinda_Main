import { type NextRequest, NextResponse } from 'next/server';

import { suggestProducts } from '@/lib/data/search';

export async function GET(request: NextRequest) {
	try {
		return NextResponse.json(await suggestProducts(request.nextUrl.searchParams.toString()), {
			headers: { 'Cache-Control': 'private, max-age=15' },
		});
	} catch (error) {
		console.error('[search]', (error as Error)?.message);
		return NextResponse.json({ message: "We couldn't search just now." }, { status: 502 });
	}
}
