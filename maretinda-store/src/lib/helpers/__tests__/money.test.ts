import { describe, expect, it } from 'vitest';

import { getPercentageDiff } from '../get-precentage-diff';
import { isEmpty } from '../isEmpty';
import { convertToLocale } from '../money';

describe('convertToLocale', () => {
	it('formats store amounts as pesos without dividing by 100', () => {
		expect(convertToLocale({ amount: 1499, currency_code: 'php' })).toBe(
			'₱1,499.00',
		);
	});

	it('respects fraction digit limits', () => {
		expect(
			convertToLocale({
				amount: 1499.5,
				currency_code: 'php',
				maximumFractionDigits: 0,
				minimumFractionDigits: 0,
			}),
		).toBe('₱1,500');
	});

	it('uses the requested locale', () => {
		expect(
			convertToLocale({ amount: 1499, currency_code: 'php', locale: 'en-PH' }),
		).toBe('₱1,499.00');
	});

	it('falls back to the bare number when there is no currency', () => {
		expect(convertToLocale({ amount: 1499, currency_code: '' })).toBe('1499');
		expect(convertToLocale({ amount: 1499, currency_code: '  ' })).toBe('1499');
	});
});

describe('getPercentageDiff', () => {
	it('returns the discount as a rounded whole percentage', () => {
		expect(getPercentageDiff(1000, 750)).toBe('25');
		expect(getPercentageDiff(999, 666)).toBe('33');
	});

	it('is zero when there is no discount', () => {
		expect(getPercentageDiff(500, 500)).toBe('0');
	});
});

describe('isEmpty', () => {
	it.each([null, undefined, {}, [], '', '   '])('treats %j as empty', (v) => {
		expect(isEmpty(v)).toBe(true);
	});

	it.each([0, false, 'a', [0], { a: 1 }])('treats %j as not empty', (v) => {
		expect(isEmpty(v)).toBe(false);
	});
});
