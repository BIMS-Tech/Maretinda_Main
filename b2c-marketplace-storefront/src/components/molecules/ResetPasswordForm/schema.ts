import { z } from 'zod';

export const resetPasswordSchema = z.object({
	confirmPassword: z.string().nonempty(''),
	newPassword: z.string().nonempty(''),
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
