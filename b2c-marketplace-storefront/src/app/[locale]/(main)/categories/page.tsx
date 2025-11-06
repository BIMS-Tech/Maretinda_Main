import type { HttpTypes } from '@medusajs/types';
import { Suspense } from 'react';

import { Breadcrumbs } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { CategoryCard } from '@/components/organisms';
import { ProductListingSkeleton } from '@/components/organisms/ProductListingSkeleton/ProductListingSkeleton';
import { AlgoliaProductsListing, ProductListing } from '@/components/sections';
import { categoryThemes } from '@/data/categories';
import { listCategories } from '@/lib/data/categories';
import { retrieveCustomer } from '@/lib/data/customer';
import { getRegion } from '@/lib/data/regions';
import { getUserWishlists } from '@/lib/data/wishlist';
import { sortCategories } from '@/lib/utils';
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
			label: 'All Categories',
			path: '/categories',
		},
	];

	const currency_code = (await getRegion(locale))?.currency_code || 'usd';

	const { categories } = (await listCategories()) as {
		categories: HttpTypes.StoreProductCategory[];
		parentCategories: HttpTypes.StoreProductCategory[];
	};

	return (
		<main className="container !max-w-7xl mx-auto">
			<div className="hidden md:block mb-2">
				<Breadcrumbs items={breadcrumbsItems} />
			</div>

			<div className="mb-8">
				<h1 className="heading-xl uppercase mb-4">Shop by Category</h1>
				<p className="text-gray-600 text-lg">
					Discover everything you need from groceries to fashion, all
					in one place
				</p>
			</div>

			{/* Main Categories Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
				{categories.map((category, index) => (
					<CategoryCard
						category={{
							description: category.description,
							handle: category.handle,
							id: index + 1,
							name: category.name,
							theme: categoryThemes[
								category.handle as keyof typeof categoryThemes
							],
						}}
						key={category.id}
					/>
				))}
			</div>

			{/* Sub-categories by Main Category */}
			<div className="space-y-12">
				{categories.map((category) => {
					const theme =
						categoryThemes[
							category.handle as keyof typeof categoryThemes
						];
					return (
						<section
							className={`p-8 rounded-xl ${theme.bgClass}`}
							key={category.id}
						>
							<div className="flex items-center mb-6">
								<span className="text-3xl mr-4">
									{theme.icon}
								</span>
								<div>
									<h2
										className={`text-2xl font-bold ${theme.textClass} mb-2`}
									>
										{category.name}
									</h2>
									<p
										className={`${theme.textClass} opacity-80`}
									>
										{category.description}
									</p>
								</div>
							</div>
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
								{category.category_children
									.sort(sortCategories)
									.map((subcategory) => (
										<LocalizedClientLink
											className={`p-4 rounded-lg border transition-all hover:shadow-md hover:scale-105 ${theme.bgClass}`}
											href={`/categories/${category.handle}/${subcategory.handle}`}
											key={subcategory.handle}
											style={{
												backgroundColor:
													theme.primary + '08',
												borderColor:
													theme.primary + '30',
											}}
										>
											<h3
												className={`font-medium ${theme.textClass}`}
											>
												{subcategory.name}
											</h3>
										</LocalizedClientLink>
									))}
							</div>
						</section>
					);
				})}
			</div>

			{/* All Products Section */}
			<div className="mt-16">
				<h2 className="heading-lg uppercase mb-8">
					Browse All Products
				</h2>
				<Suspense fallback={<ProductListingSkeleton />}>
					{!ALGOLIA_ID || !ALGOLIA_SEARCH_KEY ? (
						<ProductListing locale={locale} showSidebar />
					) : (
						<AlgoliaProductsListing
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
