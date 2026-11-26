import { describe, expect, it } from 'vitest';

import { getProductPrice } from '../get-product-price';

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
		expect(cheapestVariant?.id).toBe('b');
		expect(cheapestPrice).toMatchObject({
			calculated_price: '₱500.00',
			calculated_price_number: 500,
		});
	});

	it('ignores variants without a price', () => {
		const { cheapestVariant } = getProductPrice({
			product: product([{ id: 'x' }, variant('a', 900)]),
		});
		expect(cheapestVariant?.id).toBe('a');
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
