import { z } from 'zod';

import { PASSWORD_RULE, validatePassword } from '@/lib/helpers/password';

export const registerFormSchema = z.object({
	email: z.string().nonempty('Please enter email').email('Invalid email'),
	firstName: z.string().nonempty('Please enter first name'),
	lastName: z.string().nonempty('Please enter last name'),
	password: z
		.string()
		.nonempty('Please enter password')
		.refine((value) => validatePassword(value).isValid, { message: PASSWORD_RULE }),
	countryCode: z.string().nonempty('Please select a country code'),
	phone: z
		.string()
		.nonempty('Please enter phone number')
		.min(5, 'Please enter a valid phone number')
		.regex(/^\d+$/, {
			message: 'Phone number must contain digits only',
		}),
	terms: z.boolean().refine((value) => value, {
		message: 'Please accept terms and conditions',
	}),
});

export type RegisterFormData = z.infer<typeof registerFormSchema>;
