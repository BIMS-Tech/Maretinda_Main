import { describe, expect, it } from 'vitest';

import { giyapayMethodTitle } from '../giyapay-method';

describe('giyapayMethodTitle', () => {
	it.each([
		['MASTERCARD/VISA', 'Visa / Mastercard'],
		['GCASH', 'GCash'],
		['INSTAPAY', 'InstaPay'],
		['QRPH', 'QR Ph'],
		['WECHATPAY', 'WeChat Pay'],
		['UNIONPAY', 'UnionPay'],
	])('names %s for buyers', (gateway, title) => {
		expect(giyapayMethodTitle(gateway)).toBe(title);
	});

	it('ignores case and stray spaces', () => {
		expect(giyapayMethodTitle(' mastercard/visa ')).toBe('Visa / Mastercard');
	});

	it('leaves a place to wrap in a method it does not know', () => {
		expect(giyapayMethodTitle('NEWBANK/NEWPAY')).toBe('NEWBANK / NEWPAY');
	});
});
