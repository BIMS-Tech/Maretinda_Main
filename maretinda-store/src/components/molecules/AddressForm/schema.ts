import { z } from 'zod';

export const addressSchema = z.object({
	address: z.string().nonempty('Address is required'),
	addressId: z.string().optional(),
	addressName: z.string().nonempty('Address name is required'),
	city: z.string().nonempty('City is required'),
	company: z.string().nonempty('Company is required'),
	countryCode: z.string().nonempty('Country is required'),
	email: z.string().nonempty('Email is required').email(),
	firstName: z.string().nonempty('First name is required'),
	lastName: z.string().nonempty('Last name is required'),
	phone: z
		.string()
		.nonempty('Phone number is required')
		.regex(/^\+?[0-9\s\-()]+$/, 'Invalid phone number format'),
	postalCode: z.string().nonempty('Postal code is required'),
	province: z.string().nonempty('Province is required'),
});

export type AddressFormData = z.infer<typeof addressSchema>;
