import { describe, expect, it } from 'vitest';

import compareAddresses from '../compare-addresses';
import { parcelStatuses, steps } from '../parcel-statuses';

describe('parcelStatuses', () => {
	it.each([
		['not_fulfilled', 'Received'],
		['fulfilled', 'Preparing'],
		['partially_fulfilled', 'Preparing'],
		['shipped', 'Shipped'],
		['partially_shipped', 'Shipped'],
		['delivered', 'Delivered'],
		['partially_delivered', 'Delivered'],
		['canceled', 'Received'],
	])('shows %s as the "%s" step', (status, step) => {
		expect(steps[parcelStatuses(status)]).toBe(step);
	});
});

describe('compareAddresses', () => {
	const base = {
		address_1: '123 Rizal St',
		city: 'Makati',
		country_code: 'ph',
		first_name: 'Juan',
		last_name: 'Dela Cruz',
	};

	it('matches on name, street, city and country only', () => {
		expect(
			compareAddresses(
				{ ...base, id: 'a', phone: '0917' },
				{ ...base, id: 'b', phone: '0918' },
			),
		).toBe(true);
	});

	it.each(['first_name', 'last_name', 'address_1', 'city', 'country_code'])(
		'differs when %s differs',
		(field) => {
			expect(compareAddresses(base, { ...base, [field]: 'other' })).toBe(false);
		},
	);
});
