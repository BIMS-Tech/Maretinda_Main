import { describe, expect, it } from 'vitest';

import { voucherErrorMessage, voucherNotAppliedMessage } from '../voucher-message';

describe('voucherErrorMessage', () => {
	it('explains a code that does not exist', () => {
		expect(voucherErrorMessage('The promotion code NOPE is invalid', 'NOPE')).toBe(
			"NOPE isn't a valid voucher code",
		);
	});

	it('passes on the reasons our backend already words for buyers', () => {
		expect(voucherErrorMessage('Sign in to use this first-order voucher', 'HELLOMRTD')).toBe(
			'Sign in to use this first-order voucher',
		);
		expect(voucherErrorMessage('This voucher is only for first-time buyers', 'HELLOMRTD')).toBe(
			'This voucher is only for first-time buyers',
		);
	});

	it('falls back when there is no reason', () => {
		expect(voucherErrorMessage(undefined, 'X')).toBe("We couldn't apply X. Please try again.");
	});
});

describe('voucherNotAppliedMessage', () => {
	it('says how much more to spend', () => {
		expect(voucherNotAppliedMessage('HELLOMRTD', 770, { min_order: 1500 })).toBe(
			'Spend ₱730 more to use HELLOMRTD (min. spend ₱1,500)',
		);
	});

	it('says when a voucher has expired', () => {
		expect(
			voucherNotAppliedMessage('OLD', 2000, { expires_at: '2026-01-01T00:00:00Z' }, new Date('2026-11-09')),
		).toBe('OLD has expired');
	});

	it('gives a general reason otherwise', () => {
		expect(voucherNotAppliedMessage('ONCEONLY', 2000)).toBe(
			"ONCEONLY can't be used on this order. It may have run out or not cover these items.",
		);
	});
});
