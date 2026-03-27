import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { Breadcrumbs } from '@/components/atoms';
import { ProductListingSkeleton } from '@/components/organisms/ProductListingSkeleton/ProductListingSkeleton';
import { AlgoliaProductsListing, ProductListing } from '@/components/sections';
import { getCategoryByHandle } from '@/lib/data/categories';
import { retrieveCustomer } from '@/lib/data/customer';
import { getRegion } from '@/lib/data/regions';
import { getUserWishlists } from '@/lib/data/wishlist';
import type { Wishlist } from '@/types/wishlist';

const ALGOLIA_ID = process.env.NEXT_PUBLIC_ALGOLIA_ID;
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

const CATEGORY_BANNERS: Record<string, string> = {
	'accessories': '/images/categories/accessories-banner.png',
	'fashion': '/images/categories/fashion-banner.png',
	'food': '/images/categories/food-banner.png',
	'food-items': '/images/categories/food-items-banner.png',
	'groceries': '/images/categories/groceries-banner.png',
	'shopping': '/images/categories/shopping-banner.png',
}

function getCategoryBanner(handle: string): string {
	return CATEGORY_BANNERS[handle] ?? '/images/categories/shopping-banner.png'
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ category: string; subcategory: string }>;
}): Promise<Metadata> {
	const { category: categoryHandle, subcategory: subcategoryHandle } =
		await params;
	const category = await getCategoryByHandle([categoryHandle]);
	const subcategory = await getCategoryByHandle([subcategoryHandle]);

	if (category && subcategory) {
		const { name: categoryName } = category;
		const { name: subcategoryName } = subcategory;

		if (subcategoryName && typeof subcategoryName === 'string') {
			return {
				description: `Shop ${subcategoryName.toLowerCase()} in our ${categoryName.toLowerCase()} section`,
				title: `${subcategoryName} - ${categoryName} - Maretinda`,
			};
		}
	}

	return {
		description: `Shop ${subcategory} products`,
		title: `${subcategory} - Maretinda`,
	};
}

async function SubCategory({
	params,
	searchParams,
}: {
	params: Promise<{
		category: string;
		subcategory: string;
		locale: string;
	}>;
	searchParams?: Promise<Record<string, string | undefined>>;
}) {
	const {
		category: categoryHandle,
		subcategory: subcategoryHandle,
		locale,
	} = await params;
	const resolvedSearchParams = searchParams ? await searchParams : {};
	const category = await getCategoryByHandle([categoryHandle]);
	const subcategory = await getCategoryByHandle([subcategoryHandle]);

	if (!subcategory || !category) {
		return notFound();
	}

	const user = await retrieveCustomer();
	let wishlist: Wishlist[] = [];
	if (user) {
		try {
			const response = await getUserWishlists();
			wishlist = response.wishlists;
		} catch {
			wishlist = [];
		}
	}
	const currency_code = (await getRegion(locale))?.currency_code || 'php';

	const breadcrumbsItems = [
		{
			label: 'Home',
			path: '/',
		},
		{
			label: category.name,
			path: `/categories/${category.handle}`,
		},
		{
			label: subcategory.name,
			path: `/categories/${category.handle}/${subcategory.handle}`,
		},
	];

	return (
		<main className="container !max-w-7xl mx-auto">
			<div className="hidden md:block mb-2">
				<Breadcrumbs items={breadcrumbsItems} />
			</div>

			<Image
				alt={category.name}
				className="w-full h-auto rounded-md"
				height={2484}
				src={getCategoryBanner(category.handle)}
				width={672}
			/>

			{/* Products Listing */}
			<div className="mt-10">
				<Suspense fallback={<ProductListingSkeleton />}>
					{!ALGOLIA_ID || !ALGOLIA_SEARCH_KEY ? (
						<ProductListing
							category_id={subcategory.id}
							locale={locale}
							showSidebar
							filterParams={resolvedSearchParams}
						/>
					) : (
						<AlgoliaProductsListing
							category_id={subcategory.id}
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

export default SubCategory;
