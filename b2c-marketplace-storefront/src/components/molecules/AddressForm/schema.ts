import { z } from 'zod';

export const addressSchema = z.object({
	address: z.string().nonempty('Address is required'),
	addressId: z.string().optional(),
	addressName: z.string().nonempty('Address name is required'),
	city: z.string().nonempty('City is required'),
	company: z.string().optional(),
	countryCode: z.string().nonempty('Country is required'),
	firstName: z.string().nonempty('First name is required'),
	lastName: z.string().nonempty('Last name is required'),
	metadata: z.record(z.any()).optional(),
	phone: z
		.string()
		.nonempty('Phone number is required')
		.regex(/^\+?[0-9\s\-()]+$/, 'Invalid phone number format'),
	postalCode: z.string().nonempty('Postal code is required'),
	province: z.string().optional(),
});

export type AddressFormData = z.infer<typeof addressSchema>;
