import { z } from 'zod';

export const forgotPasswordFormSchema = z.object({
	email: z.string().nonempty('Please enter email').email('Invalid email'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordFormSchema>;
