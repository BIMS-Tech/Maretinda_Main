import { describe, expect, it } from 'vitest';

import { cardFromProduct, discountPercent, variantInStock } from '../product-card';

const variant = (over: Record<string, unknown> = {}) =>
	({ calculated_price: { calculated_amount: 100, currency_code: 'php', original_amount: 100 }, id: 'v1', inventory_quantity: 3, manage_inventory: true, ...over }) as any;
const product = (over: Record<string, unknown> = {}) =>
	({ handle: 'barong', id: 'p1', title: 'Barong', variants: [variant()], ...over }) as any;

describe('variantInStock', () => {
	it('counts stock the shop tracks', () => {
		expect(variantInStock(variant())).toBe(true);
		expect(variantInStock(variant({ inventory_quantity: 0 }))).toBe(false);
	});
	it('stock the shop does not track never runs out', () => {
		expect(variantInStock(variant({ inventory_quantity: null, manage_inventory: false }))).toBe(true);
	});
	it('allows backorders, and refuses no variant at all', () => {
		expect(variantInStock(variant({ allow_backorder: true, inventory_quantity: 0 }))).toBe(true);
		expect(variantInStock(undefined)).toBe(false);
	});
});

describe('cardFromProduct', () => {
	it('shows the cheapest variant’s price', () => {
		const p = product({ variants: [variant({ calculated_price: { calculated_amount: 300, original_amount: 300 }, id: 'a' }), variant({ calculated_price: { calculated_amount: 150, original_amount: 200 }, id: 'b' })] });
		expect(cardFromProduct(p)).toMatchObject({ original_price: 200, price: 150, variant_count: 2, variant_id: null });
	});
	it('averages product reviews only', () => {
		const reviews = [{ rating: 5, reference: 'product' }, { rating: 4, reference: 'product' }, { rating: 1, reference: 'seller' }, null];
		expect(cardFromProduct(product({ reviews }))).toMatchObject({ rating: 4.5, review_count: 2 });
	});
	it('copes with a product that has nothing', () => {
		expect(cardFromProduct(product({ variants: [] }))).toMatchObject({ in_stock: false, price: null, variant_id: null });
	});
});

describe('discountPercent', () => {
	it('works from numbers, so prices over ₱999 have a badge too', () => {
		// Formatted prices used to be parsed back into numbers, which never worked
		expect(discountPercent({ original_price: 2000, price: 1500 })).toBe(25);
		expect(discountPercent({ original_price: 100, price: 100 })).toBe(0);
		expect(discountPercent({ original_price: null, price: 5 })).toBe(0);
	});
});
