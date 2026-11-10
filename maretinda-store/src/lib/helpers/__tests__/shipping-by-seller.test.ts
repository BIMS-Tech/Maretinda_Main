import { describe, expect, it } from 'vitest';

import { chosenMethodFor, sellerNamesById } from '../shipping-by-seller';

describe('sellerNamesById', () => {
	it("maps each item's seller id to its name", () => {
		expect(
			sellerNamesById([
				{ product: { seller: { id: 'sel_a', name: 'Shop A' } } },
				{ product: { seller: { id: 'sel_b', name: 'Shop B' } } },
				{ product: {} },
			]),
		).toEqual({ sel_a: 'Shop A', sel_b: 'Shop B' });
	});
});

describe('chosenMethodFor', () => {
	const methods = [
		{ id: 'sm_1', shipping_option_id: 'so_a1' },
		{ id: 'sm_2', shipping_option_id: 'so_b2' },
	];

	it("finds the method chosen from this seller's options", () => {
		expect(
			chosenMethodFor([{ id: 'so_b1' }, { id: 'so_b2' }], methods)?.id,
		).toBe('sm_2');
	});

	it('is undefined when nothing was chosen for this seller', () => {
		expect(chosenMethodFor([{ id: 'so_c1' }], methods)).toBeUndefined();
	});
});
