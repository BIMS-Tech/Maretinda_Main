import type { HttpTypes } from '@medusajs/types';
import { Suspense } from 'react';

import { Breadcrumbs } from '@/components/atoms';
import { ProductListingSkeleton } from '@/components/organisms/ProductListingSkeleton/ProductListingSkeleton';
import { AlgoliaProductsListing, ProductListing } from '@/components/sections';
import { PARENT_CATEGORIES } from '@/const';
import { listCategories } from '@/lib/data/categories';
import { retrieveCustomer } from '@/lib/data/customer';
import { getRegion } from '@/lib/data/regions';
import { getUserWishlists } from '@/lib/data/wishlist';
import type { Wishlist } from '@/types/wishlist';

const ALGOLIA_ID = process.env.NEXT_PUBLIC_ALGOLIA_ID;
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

async function AllCategories({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const user = await retrieveCustomer();

	let wishlist: Wishlist[] = [];
	if (user) {
		try {
			const response = await getUserWishlists();
			wishlist = response.wishlists;
		} catch (error) {
			console.warn('Failed to fetch wishlist:', error);
			// Continue without wishlist data instead of crashing
			wishlist = [];
		}
	}

	const breadcrumbsItems = [
		{
			label: 'Home',
			path: '/',
		},
		{
			label: 'Search Results',
			path: '/categories',
		},
	];

	const currency_code = (await getRegion(locale))?.currency_code || 'usd';

	const { categories } = (await listCategories({
		headingCategories: PARENT_CATEGORIES,
	})) as {
		categories: HttpTypes.StoreProductCategory[];
		parentCategories: HttpTypes.StoreProductCategory[];
	};

	return (
		<main className="container !max-w-7xl mx-auto">
			<div className="hidden md:block mb-2">
				<Breadcrumbs items={breadcrumbsItems} />
			</div>

			{/* All Products Section */}
			<div className="mt-16">
				<h2 className="heading-lg uppercase mb-8">Search Results</h2>
				<Suspense fallback={<ProductListingSkeleton />}>
					{!ALGOLIA_ID || !ALGOLIA_SEARCH_KEY ? (
						<ProductListing locale={locale} showSidebar />
					) : (
						<AlgoliaProductsListing
							categories={categories}
							currency_code={currency_code}
							locale={locale}
							user={user}
							wishlist={wishlist}
						/>
					)}
				</Suspense>
			</div>
		</main>
	);
}

export default AllCategories;
