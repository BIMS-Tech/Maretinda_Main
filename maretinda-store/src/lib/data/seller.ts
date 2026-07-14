import type { SellerProps } from '@/types/seller';

import { sdk } from '../config';

export const listSellers = async ({
	limit = 8,
	offset = 0,
}: { limit?: number; offset?: number } = {}) => {
	return sdk.client
		.fetch<{ sellers: SellerProps[]; count: number }>(`/store/seller`, {
			next: { revalidate: 300 },
			query: { limit, offset, fields: 'id,name,handle,photo,description,store_status,verification_status' },
		})
		.then((res) => res)
		.catch(() => ({ sellers: [], count: 0 }));
};

export const getSellerByHandle = async (handle: string) => {
	return sdk.client
		.fetch<{ seller: SellerProps }>(`/store/seller/${handle}`, {
			next: { 
				revalidate: 60, // Revalidate every 60 seconds to show new reviews
				tags: [`seller-${handle}`, 'reviews'] 
			},
			query: {
				fields: '+created_at,+rating,+email,+verification_status,*reviews,*reviews.customer,*reviews.seller,+description',
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
