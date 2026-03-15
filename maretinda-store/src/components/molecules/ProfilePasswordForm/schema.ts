import { z } from 'zod';

export const profilePasswordSchema = z.object({
	confirmPassword: z.string().nonempty(''),
	currentPassword: z.string().nonempty(''),
	newPassword: z.string().nonempty(''),
});

export type ProfilePasswordFormData = z.infer<typeof profilePasswordSchema>;
