import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { Breadcrumbs } from '@/components/atoms';
import { ProductListingSkeleton } from '@/components/organisms/ProductListingSkeleton/ProductListingSkeleton';
import { AlgoliaProductsListing, ProductListing } from '@/components/sections';
import {
	categoryStructure,
	categoryThemes,
	primeCategories,
} from '@/data/categories';
import { getCategoryByHandle } from '@/lib/data/categories';

const ALGOLIA_ID = process.env.NEXT_PUBLIC_ALGOLIA_ID;
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

export async function generateMetadata({
	params,
}: {
	params: Promise<{ category: string; subcategory: string }>;
}): Promise<Metadata> {
	const { category, subcategory } = await params;

	// Check if this is one of our new category structure
	if (Object.keys(primeCategories).includes(category)) {
		const categoryName =
			primeCategories[category as keyof typeof primeCategories];
		const subCategories =
			categoryStructure[category as keyof typeof categoryStructure];
		const subcategoryName =
			subCategories[subcategory as keyof typeof subCategories];

		if (subcategoryName) {
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
	const { category, subcategory, locale } = await params;

	// Check if this is one of our new category structure
	if (Object.keys(primeCategories).includes(category)) {
		const categoryName =
			primeCategories[category as keyof typeof primeCategories];
		const theme = categoryThemes[category as keyof typeof categoryThemes];
		const subCategories =
			categoryStructure[category as keyof typeof categoryStructure];
		const subcategoryName =
			subCategories[subcategory as keyof typeof subCategories];

		if (!subcategoryName) {
			return notFound();
		}

		const breadcrumbsItems = [
			{
				label: 'Home',
				path: '/',
			},
			{
				label: 'Categories',
				path: '/categories',
			},
			{
				label: categoryName,
				path: `/categories/${category}`,
			},
			{
				label: subcategoryName,
				path: `/categories/${category}/${subcategory}`,
			},
		];

		return (
			<main className="container">
				<div className="hidden md:block mb-2">
					<Breadcrumbs items={breadcrumbsItems} />
				</div>

				{/* Category Header */}
				<div className={`p-8 rounded-xl mb-8 ${theme.bgClass}`}>
					<div className="flex items-center">
						<span className="text-6xl mr-6">{theme.icon}</span>
						<div>
							<div
								className={`text-sm ${theme.textClass} opacity-70 mb-2 uppercase tracking-wide`}
							>
								{categoryName}
							</div>
							<h1
								className={`heading-xl uppercase ${theme.textClass} mb-2`}
							>
								{subcategoryName}
							</h1>
							<p
								className={`text-lg ${theme.textClass} opacity-80`}
							>
								Discover the best{' '}
								{subcategoryName.toLowerCase()} from trusted
								vendors
							</p>
						</div>
					</div>
				</div>

				{/* Category-Specific Features */}
				{category === 'groceries' && (
					<div className="bg-green-50 p-6 rounded-lg mb-8 border border-green-200">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-lg font-bold text-green-800 mb-2">
									Fresh Delivery Available
								</h3>
								<p className="text-green-700">
									Same-day delivery for orders placed before 2
									PM
								</p>
							</div>
							<div className="flex gap-4 text-sm text-green-600">
								<span className="flex items-center">
									<span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
									Fresh
								</span>
								<span className="flex items-center">
									<span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
									Local
								</span>
								<span className="flex items-center">
									<span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
									Organic Options
								</span>
							</div>
						</div>
					</div>
				)}

				{category === 'food' && (
					<div className="bg-orange-50 p-6 rounded-lg mb-8 border border-orange-200">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-lg font-bold text-orange-800 mb-2">
									Hot Food Delivery
								</h3>
								<p className="text-orange-700">
									Order fresh meals with
									temperature-controlled delivery
								</p>
							</div>
							<div className="flex gap-4 text-sm text-orange-600">
								<span className="flex items-center">
									<span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
									Hot & Fresh
								</span>
								<span className="flex items-center">
									<span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
									Local Chefs
								</span>
								<span className="flex items-center">
									<span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
									Ready in 30min
								</span>
							</div>
						</div>
					</div>
				)}

				{category === 'accessories' && (
					<div className="bg-purple-50 p-6 rounded-lg mb-8 border border-purple-200">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-lg font-bold text-purple-800 mb-2">
									Premium Quality Guaranteed
								</h3>
								<p className="text-purple-700">
									Authentic accessories with quality assurance
								</p>
							</div>
							<div className="flex gap-4 text-sm text-purple-600">
								<span className="flex items-center">
									<span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
									Authentic
								</span>
								<span className="flex items-center">
									<span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
									Warranty
								</span>
								<span className="flex items-center">
									<span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
									Free Returns
								</span>
							</div>
						</div>
					</div>
				)}

				{category === 'shopping' && (
					<div className="bg-blue-50 p-6 rounded-lg mb-8 border border-blue-200">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-lg font-bold text-blue-800 mb-2">
									Fast & Reliable Shipping
								</h3>
								<p className="text-blue-700">
									Multiple shipping options with tracking
									available
								</p>
							</div>
							<div className="flex gap-4 text-sm text-blue-600">
								<span className="flex items-center">
									<span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
									Express Shipping
								</span>
								<span className="flex items-center">
									<span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
									Tracking
								</span>
								<span className="flex items-center">
									<span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
									Secure Packaging
								</span>
							</div>
						</div>
					</div>
				)}

				{category === 'fashion' && (
					<div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-lg font-bold text-gray-800 mb-2">
									Latest Fashion Trends
								</h3>
								<p className="text-gray-700">
									Curated collection from top brands and
									designers
								</p>
							</div>
							<div className="flex gap-4 text-sm text-gray-600">
								<span className="flex items-center">
									<span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
									Trending
								</span>
								<span className="flex items-center">
									<span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
									Size Guide
								</span>
								<span className="flex items-center">
									<span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
									Easy Returns
								</span>
							</div>
						</div>
					</div>
				)}

				{/* Products Listing */}
				<div>
					<div className="flex justify-between items-center mb-6">
						<h2 className="heading-lg">All {subcategoryName}</h2>
						<div
							className={`px-4 py-2 rounded-lg ${theme.bgClass}`}
						>
							<span
								className={`text-sm font-medium ${theme.textClass}`}
							>
								Filter by {categoryName.toLowerCase()}
							</span>
						</div>
					</div>

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

	// If not found in new structure, return 404
	return notFound();
}

export default SubCategory;
