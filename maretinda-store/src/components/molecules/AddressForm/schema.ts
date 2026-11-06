import { z } from 'zod';

import { toPhMobile } from '@/lib/helpers/ph-mobile';

export const addressSchema = z.object({
	address: z.string().nonempty('Address is required'),
	addressId: z.string().optional(),
	addressName: z.string().optional(),
	barangay: z.string().nonempty('Barangay is required'),
	city: z.string().nonempty('City is required'),
	company: z.string().optional(),
	countryCode: z.string().nonempty('Country is required'),
	firstName: z.string().nonempty('First name is required'),
	lastName: z.string().nonempty('Last name is required'),
	phone: z
		.string()
		.nonempty('Mobile number is required')
		.refine((value) => toPhMobile(value) !== null, {
			message: 'Enter a valid PH mobile number, e.g. 917 123 4567',
		}),
	postalCode: z.string().nonempty('Postal code is required'),
	province: z.string().nonempty('Province is required'),
});

export type AddressFormData = z.infer<typeof addressSchema>;
