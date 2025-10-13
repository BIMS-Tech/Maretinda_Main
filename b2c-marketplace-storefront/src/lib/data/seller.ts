import type { SellerProps } from '@/types/seller';

import { sdk } from '../config';

export const getSellerByHandle = async (handle: string) => {
	return sdk.client
		.fetch<{ seller: SellerProps }>(`/store/seller/${handle}`, {
			cache: 'force-cache',
			query: {
				fields: '+created_at,+rating,+email,*reviews,*reviews.customer,*reviews.seller',
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
