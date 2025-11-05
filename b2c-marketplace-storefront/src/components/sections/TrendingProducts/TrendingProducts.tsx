import Heading from '@/components/atoms/Heading/Heading';
import { retrieveCustomer } from '@/lib/data/customer';
import { listProducts } from '@/lib/data/products';
import { getUserWishlists } from '@/lib/data/wishlist';
import type { Product } from '@/types/product';
import type { Wishlist } from '@/types/wishlist';

import TrendingProductsCarousel from './TrendingProductsCarousel';

export const TrendingProducts = async ({
	locale = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'pl',
	sellerProducts = [],
}: {
	locale?: string;
	sellerProducts?: Product[];
}) => {
	const {
		response: { products },
	} = await listProducts({
		countryCode: locale,
		queryParams: {
			limit: 99999,
			order: 'created_at',
		},
	});

	const finalProducts = (
		sellerProducts.length ? sellerProducts : products
	) as Product[];

	const user = await retrieveCustomer();

	let wishlist: Wishlist[] = [];
	if (user) {
		try {
			const response = await getUserWishlists();
			wishlist = response.wishlists;
		} catch (error) {
			console.warn('Failed to fetch wishlist:', error);
			wishlist = [];
		}
	}

	return (
		<div className="w-full">
			<div className="mb-10">
				<Heading label="Trending Products" />
			</div>
			<TrendingProductsCarousel
				finalProducts={finalProducts}
				user={user}
				wishlist={wishlist}
			/>
		</div>
	);
};
