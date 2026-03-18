import { z } from 'zod';

export const registerFormSchema = z.object({
	email: z.string().nonempty('Please enter email').email('Invalid email'),
	firstName: z.string().nonempty('Please enter first name'),
	lastName: z.string().nonempty('Please enter last name'),
	password: z
		.string()
		.nonempty('Please enter password')
		.min(8, 'Password must be at least 8 characters long')
		.regex(/^(?=.*[A-Z])(?=.*[!@#$%^&*])/, {
			message:
				'Password must contain at least one uppercase letter and one special character',
		}),
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
