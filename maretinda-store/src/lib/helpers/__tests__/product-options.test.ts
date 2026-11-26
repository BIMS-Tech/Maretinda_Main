import { describe, expect, it } from 'vitest';

import { openingChoice, pickValue, valueAvailability, variantFor } from '@/lib/product-options';

const v = (id: string, choice: Record<string, string>, over: Record<string, unknown> = {}) =>
	({
		calculated_price: { calculated_amount: 100 },
		id,
		inventory_quantity: 5,
		manage_inventory: true,
		options: Object.entries(choice).map(([title, value]) => ({ option: { title }, value })),
		...over,
	}) as any;

const sizes = [v('m', { Size: 'M' }), v('l', { Size: 'L' }), v('xl', { Size: 'XL' }), v('xxl', { Size: 'XXL' })];

describe('variantFor', () => {
	it('tells L, XL and XXL apart', () => {
		expect(variantFor(sizes, { size: 'XL' })?.id).toBe('xl');
		expect(variantFor(sizes, { size: 'L' })?.id).toBe('l');
		expect(variantFor(sizes, { size: 'XXL' })?.id).toBe('xxl');
	});
	it('needs every choice', () => {
		const list = [v('a', { Color: 'Red', Size: 'M' }), v('b', { Color: 'Blue', Size: 'M' })];
		expect(variantFor(list, { color: 'Blue', size: 'M' })?.id).toBe('b');
		expect(variantFor(list, { size: 'M' })).toBeUndefined();
	});
});

describe('choosing', () => {
	const list = [
		v('rm', { Color: 'Red', Size: 'M' }),
		v('rl', { Color: 'Red', Size: 'L' }, { inventory_quantity: 0 }),
		v('bl', { Color: 'Blue', Size: 'L' }, { calculated_price: { calculated_amount: 80 } }),
	];
	it('says what can be had with the other choices', () => {
		const choice = { color: 'Red', size: 'M' };
		expect(valueAvailability(list, choice, 'size', 'L')).toBe('sold_out');
		expect(valueAvailability(list, choice, 'color', 'Red')).toBe('available');
		expect(valueAvailability(list, choice, 'color', 'Blue')).toBe('none');
	});
	it('moves the other choices when a combination is not sold', () => {
		expect(pickValue(list, { color: 'Red', size: 'M' }, 'color', 'Blue')).toEqual({ color: 'Blue', size: 'L' });
		expect(pickValue(list, { color: 'Red', size: 'M' }, 'size', 'L')).toEqual({ color: 'Red', size: 'L' });
	});
	it('opens on the cheapest that can be bought', () => {
		expect(openingChoice(list, {})).toEqual({ color: 'Blue', size: 'L' });
	});
	it('opens on what the link asked for, when it exists', () => {
		expect(openingChoice(list, { color: 'Red', size: 'M', utm_source: 'fb' })).toEqual({ color: 'Red', size: 'M' });
		expect(openingChoice(list, { color: 'Red' })).toEqual({ color: 'Red', size: 'M' });
		expect(openingChoice(list, { color: 'Red', size: 'L' })).toEqual({ color: 'Red', size: 'L' });
		expect(openingChoice(list, { color: 'Green' })).toEqual({ color: 'Blue', size: 'L' });
	});
	it('copes with a product that has no variants', () => {
		expect(openingChoice([], {})).toEqual({});
		expect(variantFor(undefined, {})).toBeUndefined();
	});
});
