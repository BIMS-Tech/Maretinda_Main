import type { SellerProps } from '@/types/seller';

import { sdk } from '../config';

export const getSellerByHandle = async (handle: string) => {
	return sdk.client
		.fetch<{ seller: SellerProps }>(`/store/seller/${handle}`, {
			next: { 
				revalidate: 60, // Revalidate every 60 seconds to show new reviews
				tags: [`seller-${handle}`, 'reviews'] 
			},
			query: {
				fields: '+created_at,+rating,+email,*reviews,*reviews.customer,*reviews.seller,+description',
			},
		})
		.then(({ seller }) => {
			const response = {
				...seller,
				reviews: seller.reviews?.filter((item) => item !== null) ?? [],
			};

			return response as SellerProps;
		})
		.catch(() => []);
};
