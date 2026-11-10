import { describe, expect, it } from 'vitest';

import { sellerAddressLines } from '../seller-address';

describe('sellerAddressLines', () => {
	it('skips the parts a seller left empty instead of printing bare commas', () => {
		expect(
			sellerAddressLines({
				address_line: '1 Rizal St, Angeles City, Pampanga',
				city: null,
				country_code: null,
				email: 'shop@example.com',
				phone: '+639171234567',
				postal_code: null,
				state: null,
			}),
		).toEqual([
			'1 Rizal St, Angeles City, Pampanga',
			'shop@example.com · +639171234567',
		]);
	});

	it('joins city with province and postal code with country', () => {
		expect(
			sellerAddressLines({
				address_line: '1 Rizal St',
				city: 'Angeles City',
				country_code: 'ph',
				postal_code: '2009',
				state: 'Pampanga',
			}),
		).toEqual(['1 Rizal St', 'Angeles City, Pampanga', '2009 PH']);
	});

	it('returns nothing for a missing seller', () => {
		expect(sellerAddressLines(undefined)).toEqual([]);
	});
});
