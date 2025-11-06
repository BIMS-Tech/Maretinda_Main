import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { Breadcrumbs } from '@/components/atoms';
import { ProductListingSkeleton } from '@/components/organisms/ProductListingSkeleton/ProductListingSkeleton';
import { AlgoliaProductsListing, ProductListing } from '@/components/sections';
import { categoryThemes } from '@/data/categories';
import { getCategoryByHandle } from '@/lib/data/categories';

const ALGOLIA_ID = process.env.NEXT_PUBLIC_ALGOLIA_ID;
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

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
}: {
	params: Promise<{
		category: string;
		subcategory: string;
		locale: string;
	}>;
}) {
	const {
		category: categoryHandle,
		subcategory: subcategoryHandle,
		locale,
	} = await params;
	const theme = categoryThemes[categoryHandle as keyof typeof categoryThemes];
	const category = await getCategoryByHandle([categoryHandle]);
	const subcategory = await getCategoryByHandle([subcategoryHandle]);

	if (!subcategory) {
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
				alt="A product"
				className="w-full h-auto rounded-md"
				height={2484}
				src={`/images/categories/${category.handle}-banner.png`}
				width={672}
			/>

			{/* Products Listing */}
			<div className="mt-10">
				<Suspense fallback={<ProductListingSkeleton />}>
					{!ALGOLIA_ID || !ALGOLIA_SEARCH_KEY ? (
						<ProductListing locale={locale} showSidebar />
					) : (
						<AlgoliaProductsListing
							locale={locale}
							// Add subcategory filter here when integrating with backend
						/>
					)}
				</Suspense>
			</div>
		</main>
	);
}

export default SubCategory;
