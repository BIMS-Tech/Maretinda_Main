import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { Breadcrumbs } from '@/components/atoms';
import { CategoryHeader } from '@/components/organisms/ProductBrowser/CategoryHeader';
import { ProductListing } from '@/components/organisms/ProductBrowser/ProductListing';
import { ProductListingSkeleton } from '@/components/organisms/ProductListingSkeleton/ProductListingSkeleton';
import { getCategoryByHandle } from '@/lib/data/categories';
import { generateCategoryMetadata } from '@/lib/helpers/seo';

type Props = {
	params: Promise<{ category: string; locale: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { category } = await params;
	const cat = await getCategoryByHandle([category]);
	if (!cat) return {};
	return generateCategoryMetadata(cat);
}

export default async function Category({ params, searchParams }: Props) {
	const { category: handle } = await params;
	const category = await getCategoryByHandle([handle]);
	if (!category) return notFound();

	return (
		<main className="mx-auto w-full max-w-[1360px] px-4 pb-20 pt-5 lg:px-6">
			<div className="mb-3 hidden md:block">
				<Breadcrumbs
					items={[
						{ label: 'Home', path: '/' },
						{ label: 'Categories', path: '/categories' },
						{ label: category.name, path: `/categories/${category.handle}` },
					]}
				/>
			</div>
			<CategoryHeader category={category} />
			<div className="mt-8">
				<Suspense fallback={<ProductListingSkeleton />}>
					<ProductListing scope={{ category_id: category.id }} searchParams={await searchParams} />
				</Suspense>
			</div>
		</main>
	);
}
