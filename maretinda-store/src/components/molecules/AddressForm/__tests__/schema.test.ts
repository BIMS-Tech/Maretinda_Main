import { describe, expect, it } from 'vitest';

import { addressSchema } from '../schema';

const valid = {
	address: '123 Rizal St',
	barangay: 'Poblacion',
	city: 'Makati',
	countryCode: 'ph',
	firstName: 'Juan',
	lastName: 'Dela Cruz',
	phone: '+63 917 000 0000',
	postalCode: '1200',
	province: 'Metro Manila',
};

describe('addressSchema', () => {
	it('saves without a company or an address label', () => {
		expect(addressSchema.safeParse(valid).success).toBe(true);
		expect(
			addressSchema.safeParse({ ...valid, addressName: '', company: '' })
				.success,
		).toBe(true);
	});

	it.each([
		'address',
		'barangay',
		'city',
		'countryCode',
		'firstName',
		'lastName',
		'phone',
		'postalCode',
		'province',
	])('still requires %s', (field) => {
		expect(addressSchema.safeParse({ ...valid, [field]: '' }).success).toBe(
			false,
		);
	});

	it.each(['09171234567', '9171234567', '+63 917 123 4567', '0917-123-4567'])(
		'accepts the PH mobile %s',
		(phone) => {
			expect(addressSchema.safeParse({ ...valid, phone }).success).toBe(true);
		},
	);

	it.each(['12345', '0282345678', '+1 415 555 0100', '09171234'])(
		'refuses %s as a mobile number',
		(phone) => {
			expect(addressSchema.safeParse({ ...valid, phone }).success).toBe(false);
		},
	);
});
