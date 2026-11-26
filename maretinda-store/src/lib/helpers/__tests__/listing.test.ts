import { describe, expect, it } from 'vitest';

import { activeFilterCount, clearFilter, clearFilters, listingRequest, readListing, toggleFilter, toSearchParams, writeListing } from '@/lib/listing';

const read = (query: string) => readListing(new URLSearchParams(query));

describe('a listing in the address', () => {
	it('reads and writes back the same state', () => {
		const query = 'q=linen+dress&color=Red&color=Blue&size=M&min_price=100&max_price=900&rating=4&on_sale=1&in_stock=1&verified=1&sort=price_asc';
		expect(writeListing(read(query)).toString()).toBe(query);
	});

	it('keeps both ends of a price range', () => {
		// The old filter set them one after the other and lost the first
		expect(read('min_price=100&max_price=900')).toMatchObject({ max_price: 900, min_price: 100 });
		expect(read('min_price=0').min_price).toBe(0);
	});

	it('keeps a value with a comma in it whole', () => {
		const state = toggleFilter(read(''), 'color', 'Red, White');
		expect(read(writeListing(state).toString()).filters.color).toEqual(['Red, White']);
	});

	it('takes search links from before', () => {
		expect(read('query=sneakers').q).toBe('sneakers');
		expect(read('category_name=Boots').filters).toEqual({ category: ['Boots'] });
	});

	it('is not upset by rubbish or other sites’ tags', () => {
		expect(read('min_price=abc&max_price=-4&rating=9&sort=sideways&on_sale=maybe')).toMatchObject({
			max_price: null, min_price: null, on_sale: false, rating: null, sort: null,
		});
		expect(read('utm_source=fb&fbclid=x&gclid=y&Robert%27);--=1&__proto__=1').filters).toEqual({});
	});

	it('writes nothing for a plain listing', () => {
		expect(writeListing(read('')).toString()).toBe('');
	});
});

describe('changing filters', () => {
	it('adds and takes away, whatever the case', () => {
		const one = toggleFilter(read(''), 'color', 'Red');
		expect(one.filters).toEqual({ color: ['Red'] });
		expect(toggleFilter(one, 'color', 'red').filters).toEqual({});
	});

	it('clears one filter and leaves the others', () => {
		// The old "Clear" on one filter cleared all of them, and the search too
		expect(clearFilter(read('q=x&color=Red&size=M'), 'color')).toMatchObject({ filters: { size: ['M'] }, q: 'x' });
	});

	it('clears every filter but keeps what was searched and the order', () => {
		expect(clearFilters(read('q=x&color=Red&min_price=1&rating=4&on_sale=1&sort=newest'))).toMatchObject({
			filters: {}, min_price: null, on_sale: false, q: 'x', rating: null, sort: 'newest',
		});
	});

	it('counts filters, not the search words', () => {
		expect(activeFilterCount(read('q=x&sort=newest'))).toBe(0);
		expect(activeFilterCount(read('color=Red&color=Blue&min_price=1&max_price=2&rating=4&verified=1'))).toBe(5);
	});
});

describe('asking the backend', () => {
	it('adds what the page is limited to', () => {
		expect(listingRequest(read('color=Red'), { category_id: 'pcat_1' }, 2)).toBe('color=Red&category_id=pcat_1&page=2&limit=24');
	});

	it('can’t be widened from the address', () => {
		expect(listingRequest(read('seller=other&limit=9999'), { seller: 'aling-nena' })).toBe('seller=aling-nena&limit=24');
	});

	it('turns Next’s searchParams into a query', () => {
		expect(toSearchParams({ a: ['1', '2'], b: 'x', c: undefined }).toString()).toBe('a=1&a=2&b=x');
	});
});
