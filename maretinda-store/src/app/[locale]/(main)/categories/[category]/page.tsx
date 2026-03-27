import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { Breadcrumbs } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { ProductListingSkeleton } from '@/components/organisms/ProductListingSkeleton/ProductListingSkeleton';
import { AlgoliaProductsListing, ProductListing } from '@/components/sections';
import { categoryThemes } from '@/data/categories';
import { getCategoryByHandle } from '@/lib/data/categories';
import { retrieveCustomer } from '@/lib/data/customer';
import { getRegion } from '@/lib/data/regions';
import { getUserWishlists } from '@/lib/data/wishlist';
import { generateCategoryMetadata } from '@/lib/helpers/seo';
import { sortCategories } from '@/lib/utils';
import type { Wishlist } from '@/types/wishlist';

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

const DEFAULT_THEME = {
	accent: '#00BCD4',
	bgClass: 'bg-gray-50',
	icon: '🏷️',
	primary: '#6B7280',
	secondary: '#9CA3AF',
	textClass: 'text-gray-800',
};

const ALGOLIA_ID = process.env.NEXT_PUBLIC_ALGOLIA_ID;
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

export async function generateMetadata({
	params,
}: {
	params: Promise<{ category: string }>;
}): Promise<Metadata> {
	const { category } = await params;

	const cat = await getCategoryByHandle([category]);
	if (!cat) return {};
	return generateCategoryMetadata(cat);
}

async function Category({
	params,
	searchParams,
}: {
	params: Promise<{
		category: string;
		locale: string;
	}>;
	searchParams?: Promise<Record<string, string | undefined>>;
}) {
	const { category: handle, locale } = await params;
	const resolvedSearchParams = searchParams ? await searchParams : {};
	const theme = categoryThemes[handle as keyof typeof categoryThemes] ?? DEFAULT_THEME;
	const category = await getCategoryByHandle([handle]);

	if (!category) {
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
	];

	return (
		<main className="container !max-w-7xl mx-auto">
			<div className="hidden md:block mb-2">
				<Breadcrumbs items={breadcrumbsItems} />
			</div>

			<Image
				alt={category.name}
				className="w-full h-auto rounded-md"
				height={335}
				src={getCategoryBanner(category.handle)}
				width={1248}
			/>

			{/* Sub-categories Grid */}
			<div className="mt-4 mb-12">
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
					{category.category_children
						.sort(sortCategories)
						.map((subcategory) => (
							<LocalizedClientLink
								className={`group p-6 rounded-lg border transition-all hover:shadow-lg hover:scale-105 ${theme.bgClass}`}
								href={`/categories/${handle}/${subcategory.handle}`}
								key={subcategory.handle}
								style={{
									backgroundColor: theme.primary + '08',
									borderColor: theme.primary + '30',
								}}
							>
								<h3
									className={`font-medium text-lg ${theme.textClass} group-hover:underline`}
								>
									{subcategory.name}
								</h3>
								<p
									className={`text-sm ${theme.textClass} opacity-70 mt-2`}
								>
									Explore {subcategory.name.toLowerCase()}
								</p>
							</LocalizedClientLink>
						))}
				</div>
			</div>

			{/* Featured Products in Category */}
			<div>
				<h2 className="heading-lg mb-6">Featured Products</h2>
				<Suspense fallback={<ProductListingSkeleton />}>
					{!ALGOLIA_ID || !ALGOLIA_SEARCH_KEY ? (
						<ProductListing
							category_id={category.id}
							locale={locale}
							showSidebar
							filterParams={resolvedSearchParams}
						/>
					) : (
						<AlgoliaProductsListing
							category_id={category.id}
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

export default Category;
