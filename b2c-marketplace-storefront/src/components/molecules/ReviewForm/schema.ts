import { z } from 'zod';

export const reviewSchema = z.object({
	opinion: z
		.string()
		.max(300, 'Opinion must be less than 300 characters')
		.optional(),
	rating: z.number().min(1, 'Please rate this seller').max(5),
	sellerId: z.string(),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;
