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
import { generateCategoryMetadata } from '@/lib/helpers/seo';
import { sortCategories } from '@/lib/utils';

const ALGOLIA_ID = process.env.NEXT_PUBLIC_ALGOLIA_ID;
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

export async function generateMetadata({
	params,
}: {
	params: Promise<{ category: string }>;
}): Promise<Metadata> {
	const { category } = await params;

	return generateCategoryMetadata(await getCategoryByHandle([category]));
}

async function Category({
	params,
}: {
	params: Promise<{
		category: string;
		locale: string;
	}>;
}) {
	const { category: handle, locale } = await params;
	const theme = categoryThemes[handle as keyof typeof categoryThemes];
	const category = await getCategoryByHandle([handle]);

	if (!category) {
		return notFound();
	}

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
				alt="A product"
				className="w-full h-auto rounded-md"
				height={335}
				src={`/images/categories/${category.handle}-banner.png`}
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
						<ProductListing locale={locale} showSidebar />
					) : (
						<AlgoliaProductsListing
							locale={locale}
							// Add category filter here when integrating with backend
						/>
					)}
				</Suspense>
			</div>
		</main>
	);
}

export default Category;
