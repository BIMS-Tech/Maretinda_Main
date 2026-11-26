import 'server-only';

import { headers as requestHeaders } from 'next/headers';

import { forwardedAuthHeaders } from '@/lib/helpers/forwarded-auth';
import type { SearchResponse, SuggestResponse } from '@/types/search';

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';

const NOTHING: SearchResponse = {
	count: 0,
	currency_code: 'php',
	did_you_mean: null,
	facets: [],
	in_stock_count: 0,
	limit: 24,
	on_sale_count: 0,
	page: 1,
	pages: 1,
	price: null,
	products: [],
	rating_counts: {},
	relaxed: false,
	sort: 'popular',
	verified_count: 0,
};

async function ask<T>(path: string): Promise<T> {
	const res = await fetch(`${BACKEND_URL}${path}`, {
		cache: 'no-store',
		headers: {
			'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
			// So the limit on searches is per shopper, not for the whole store
			...forwardedAuthHeaders(await requestHeaders(), process.env.STORE_SERVER_SECRET),
		},
	});
	if (!res.ok) throw new Error(`Search answered ${res.status}`);
	return res.json();
}

/** Throws when the backend can't be reached, so a page can say so rather than "no results". */
export const searchProducts = (query: string) => ask<SearchResponse>(`/store/search?${query}`);

export const suggestProducts = (query: string) => ask<SuggestResponse>(`/store/search/suggest?${query}`);

/** For sections that are simply left out when there is nothing to show. */
export const searchProductsOrNothing = (query: string) =>
	searchProducts(query).catch((error) => {
		console.error('[search]', error?.message ?? error);
		return NOTHING;
	});
