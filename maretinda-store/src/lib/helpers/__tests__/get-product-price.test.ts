import { describe, expect, it } from 'vitest';

import { getProductPrice } from '../get-product-price';
import { sortProducts } from '../sort-products';

const variant = (id: string, calculated: number, original = calculated) => ({
	calculated_price: {
		calculated_amount: calculated,
		calculated_price: { price_list_type: calculated < original ? 'sale' : null },
		currency_code: 'php',
		original_amount: original,
	},
	id,
	sku: `SKU-${id}`,
});

const product = (variants: any[], over: Record<string, any> = {}) =>
	({ id: 'prod_1', variants, ...over }) as any;

describe('getProductPrice', () => {
	it('picks the cheapest priced variant', () => {
		const { cheapestPrice, cheapestVariant } = getProductPrice({
			product: product([variant('a', 900), variant('b', 500), variant('c', 700)]),
		});
		expect(cheapestVariant.id).toBe('b');
		expect(cheapestPrice).toMatchObject({
			calculated_price: '₱500.00',
			calculated_price_number: 500,
		});
	});

	it('ignores variants without a price', () => {
		const { cheapestVariant } = getProductPrice({
			product: product([{ id: 'x' }, variant('a', 900)]),
		});
		expect(cheapestVariant.id).toBe('a');
	});

	it('reports a sale with its original price and discount', () => {
		const { cheapestPrice } = getProductPrice({
			product: product([variant('a', 750, 1000)]),
		});
		expect(cheapestPrice).toMatchObject({
			original_price: '₱1,000.00',
			percentage_diff: '25',
			price_type: 'sale',
		});
	});

	it('finds the selected variant by id or by SKU', () => {
		const p = product([variant('a', 900), variant('b', 500)]);
		expect(
			getProductPrice({ product: p, variantId: 'a' }).variantPrice
				?.calculated_price_number,
		).toBe(900);
		expect(
			getProductPrice({ product: p, variantId: 'SKU-a' }).variantPrice
				?.calculated_price_number,
		).toBe(900);
		expect(
			getProductPrice({ product: p, variantId: 'missing' }).variantPrice,
		).toBeNull();
	});

	it('returns no price for a product with no variants', () => {
		expect(getProductPrice({ product: product([]) })).toMatchObject({
			cheapestPrice: null,
			cheapestVariant: null,
		});
	});

	it('throws without a product', () => {
		expect(() => getProductPrice({ product: {} as any })).toThrow(
			'No product provided',
		);
	});
});

describe('sortProducts', () => {
	const p = (id: string, prices: number[], created_at = '2026-01-01') =>
		({
			created_at,
			id,
			variants: prices.map((n, i) => variant(`${id}${i}`, n)),
		}) as any;

	it('sorts by each product’s cheapest variant, ascending and descending', () => {
		const list = () => [p('a', [900, 300]), p('b', [500]), p('c', [700])];
		expect(sortProducts(list(), 'price_asc').map((x) => x.id)).toEqual([
			'a',
			'b',
			'c',
		]);
		expect(sortProducts(list(), 'price_desc').map((x) => x.id)).toEqual([
			'c',
			'b',
			'a',
		]);
	});

	it('puts products without variants last when sorting by price ascending', () => {
		const sorted = sortProducts([p('none', []), p('b', [500])], 'price_asc');
		expect(sorted.map((x) => x.id)).toEqual(['b', 'none']);
	});

	it('sorts newest first by created_at', () => {
		const sorted = sortProducts(
			[p('old', [1], '2025-01-01'), p('new', [1], '2026-06-01')],
			'created_at',
		);
		expect(sorted.map((x) => x.id)).toEqual(['new', 'old']);
	});
});
