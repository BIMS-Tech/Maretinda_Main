import { Suspense } from 'react';

import { Breadcrumbs } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { CategoryCard } from '@/components/organisms';
import { ProductListingSkeleton } from '@/components/organisms/ProductListingSkeleton/ProductListingSkeleton';
import { AlgoliaProductsListing, ProductListing } from '@/components/sections';
import {
	categoryStructure,
	categoryThemes,
	primeCategories,
} from '@/data/categories';
import { getRegion } from '@/lib/data/regions';

const ALGOLIA_ID = process.env.NEXT_PUBLIC_ALGOLIA_ID;
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

async function AllCategories({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;

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

	const categories = Object.entries(primeCategories).map(
		([handle, name], index) => ({
			handle,
			id: index + 1,
			name,
			theme: categoryThemes[handle as keyof typeof categoryThemes],
		}),
	);

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
				{categories.map((category) => (
					<CategoryCard category={category} key={category.id} />
				))}
			</div>

			{/* Sub-categories by Main Category */}
			<div className="space-y-12">
				{Object.entries(categoryStructure).map(
					([mainCategory, subCategories]) => {
						const theme =
							categoryThemes[
								mainCategory as keyof typeof categoryThemes
							];
						return (
							<section
								className={`p-8 rounded-xl ${theme.bgClass}`}
								key={mainCategory}
							>
								<div className="flex items-center mb-6">
									<span className="text-3xl mr-4">
										{theme.icon}
									</span>
									<div>
										<h2
											className={`text-2xl font-bold ${theme.textClass} mb-2`}
										>
											{
												primeCategories[
													mainCategory as keyof typeof primeCategories
												]
											}
										</h2>
										<p
											className={`${theme.textClass} opacity-80`}
										>
											{theme.description}
										</p>
									</div>
								</div>
								<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
									{Object.entries(subCategories).map(
										([handle, name]) => (
											<LocalizedClientLink
												className={`p-4 rounded-lg border transition-all hover:shadow-md hover:scale-105 ${theme.bgClass}`}
												href={`/categories/${mainCategory}/${handle}`}
												key={handle}
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
													{name}
												</h3>
											</LocalizedClientLink>
										),
									)}
								</div>
							</section>
						);
					},
				)}
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
						/>
					)}
				</Suspense>
			</div>
		</main>
	);
}

export default AllCategories;
