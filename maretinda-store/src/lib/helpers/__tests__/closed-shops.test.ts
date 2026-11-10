import { describe, expect, it } from 'vitest';

import { withoutClosedShops } from '../closed-shops';

describe('withoutClosedShops', () => {
	it('leaves the filter alone when every shop is open', () => {
		expect(
			withoutClosedShops('NOT seller.store_status:SUSPENDED', []),
		).toBe('NOT seller.store_status:SUSPENDED');
	});

	it('excludes each closed shop by handle', () => {
		expect(
			withoutClosedShops('NOT seller.store_status:SUSPENDED', [
				'shop-a',
				'shop-b',
			]),
		).toBe(
			'NOT seller.store_status:SUSPENDED AND NOT seller.handle:"shop-a" AND NOT seller.handle:"shop-b"',
		);
	});

	it('drops quotes from a handle so it cannot break out of the filter', () => {
		expect(withoutClosedShops('X', ['a" OR "b'])).toBe(
			'X AND NOT seller.handle:"a OR b"',
		);
	});
});
