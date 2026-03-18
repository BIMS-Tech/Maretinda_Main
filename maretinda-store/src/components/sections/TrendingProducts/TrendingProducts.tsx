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
	const [{ response: { products } }, user] = await Promise.all([
		listProducts({
			countryCode: locale,
			queryParams: { limit: 24, order: 'created_at' },
		}),
		retrieveCustomer(),
	]);

	const finalProducts = (
		sellerProducts.length ? sellerProducts : products
	) as Product[];

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
