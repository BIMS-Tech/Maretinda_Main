import { type ListingScope, SORTS, type Sort } from '@/types/search';

/**
 * A listing's state lives in its address, so it can be refreshed, shared and
 * gone back to. Filters are repeated keys (?color=Red&color=Blue): a comma can
 * be part of a value.
 */
export type ListingState = {
	q: string;
	sort: Sort | null;
	filters: Record<string, string[]>;
	min_price: number | null;
	max_price: number | null;
	rating: number | null;
	on_sale: boolean;
	in_stock: boolean;
	verified: boolean;
};

const RESERVED = new Set(['q', 'query', 'sort', 'page', 'limit', 'min_price', 'max_price', 'rating', 'on_sale', 'in_stock', 'verified']);
/** Not ours: ad and share tags, and the filters the address carried before. */
const NOT_FILTERS = /^(utm_|_|fb|gclid|gad|ref$|igsh|ttclid|returnTo|error|products\[)/i;
const FILTER_NAME = /^[a-z][a-z0-9_]{0,39}$/;
const RENAMED: Record<string, string> = { category_name: 'category' };

const price = (raw: string | null): number | null => {
	if (raw === null || raw.trim() === '') return null;
	const n = Number(raw);
	return Number.isFinite(n) && n >= 0 ? n : null;
};

export function readListing(params: URLSearchParams): ListingState {
	const filters: Record<string, string[]> = {};
	for (const key of new Set(params.keys())) {
		const name = RENAMED[key] ?? key;
		if (RESERVED.has(key) || NOT_FILTERS.test(key) || !FILTER_NAME.test(name)) continue;
		const values = [...new Set(params.getAll(key).map((v) => v.trim()).filter(Boolean))];
		if (values.length) filters[name] = values;
	}
	const sort = params.get('sort');
	const rating = price(params.get('rating'));
	const flag = (key: string) => ['1', 'true'].includes(params.get(key) ?? '');
	return {
		filters,
		in_stock: flag('in_stock'),
		max_price: price(params.get('max_price')),
		min_price: price(params.get('min_price')),
		on_sale: flag('on_sale'),
		q: (params.get('q') ?? params.get('query') ?? '').trim(),
		rating: rating && rating <= 5 ? rating : null,
		sort: SORTS.includes(sort as Sort) ? (sort as Sort) : null,
		verified: flag('verified'),
	};
}

/** The address for a state: only what differs from the plain listing. */
export function writeListing(state: ListingState): URLSearchParams {
	const params = new URLSearchParams();
	if (state.q) params.set('q', state.q);
	for (const [name, values] of Object.entries(state.filters)) for (const v of values) params.append(name, v);
	if (state.min_price != null) params.set('min_price', String(state.min_price));
	if (state.max_price != null) params.set('max_price', String(state.max_price));
	if (state.rating) params.set('rating', String(state.rating));
	if (state.on_sale) params.set('on_sale', '1');
	if (state.in_stock) params.set('in_stock', '1');
	if (state.verified) params.set('verified', '1');
	if (state.sort) params.set('sort', state.sort);
	return params;
}

/** The request for a page of a listing. */
export function listingRequest(state: ListingState, scope: ListingScope, page = 1, limit = 24): string {
	const params = writeListing(state);
	if (scope.category_id) params.set('category_id', scope.category_id);
	if (scope.collection_id) params.set('collection_id', scope.collection_id);
	if (scope.seller) params.set('seller', scope.seller);
	if (page > 1) params.set('page', String(page));
	params.set('limit', String(limit));
	return params.toString();
}

/** How many filters are on. The search words and the order aren't filters. */
export const activeFilterCount = (s: ListingState): number =>
	Object.values(s.filters).reduce((n, v) => n + v.length, 0) +
	(s.min_price != null || s.max_price != null ? 1 : 0) +
	(s.rating ? 1 : 0) +
	Number(s.on_sale) +
	Number(s.in_stock) +
	Number(s.verified);

export const toggleFilter = (s: ListingState, name: string, value: string): ListingState => {
	const current = s.filters[name] ?? [];
	const same = (a: string) => a.toLowerCase() === value.toLowerCase();
	const next = current.some(same) ? current.filter((v) => !same(v)) : [...current, value];
	const { [name]: _removed, ...rest } = s.filters;
	return { ...s, filters: next.length ? { ...rest, [name]: next } : rest };
};

export const clearFilter = (s: ListingState, name: string): ListingState => {
	const { [name]: _removed, ...rest } = s.filters;
	return { ...s, filters: rest };
};

/** Every filter off; the search words and the order stay. */
export const clearFilters = (s: ListingState): ListingState => ({
	...s,
	filters: {},
	in_stock: false,
	max_price: null,
	min_price: null,
	on_sale: false,
	rating: null,
	verified: false,
});

/** Next's searchParams object as URLSearchParams. */
export const toSearchParams = (raw: Record<string, string | string[] | undefined>): URLSearchParams => {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(raw)) {
		for (const v of Array.isArray(value) ? value : value === undefined ? [] : [value]) params.append(key, v);
	}
	return params;
};
