import Heading from '@/components/atoms/Heading/Heading';
import { HomeProductsCarousel } from '@/components/organisms';
import { AlgoliaProductsCarousel } from '@/components/organisms/HomeProductsCarousel/AlgoliaProductsCarousel';
import { retrieveCustomer } from '@/lib/data/customer';
import { getRegion } from '@/lib/data/regions';
import { getUserWishlists } from '@/lib/data/wishlist';
import type { Product } from '@/types/product';
import type { Wishlist } from '@/types/wishlist';

const ALGOLIA_ID = process.env.NEXT_PUBLIC_ALGOLIA_ID;
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

export const HomeProductSection = async ({
	heading,
	locale = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'pl',
	products = [],
	home = false,
	seller_handle,
}: {
	heading: string;
	locale?: string;
	products?: Product[];
	home?: boolean;
	seller_handle?: string;
}) => {
	const currency_code = (await getRegion(locale))?.currency_code || 'usd';
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
		<section className="py-8 w-full">
			<div className="mb-10">
				<Heading label={heading} />
			</div>
			{!ALGOLIA_ID || !ALGOLIA_SEARCH_KEY ? (
				<HomeProductsCarousel
					home={home}
					locale={locale}
					sellerProducts={products.slice(0, 4)}
				/>
			) : seller_handle ? (
				<HomeProductsCarousel
					home={home}
					locale={locale}
					sellerProducts={products.slice(0, 4)}
				/>
			) : (
				<AlgoliaProductsCarousel
					currency_code={currency_code}
					locale={locale}
					seller_handle={seller_handle}
					user={user}
					wishlist={wishlist}
				/>
			)}
		</section>
	);
};
