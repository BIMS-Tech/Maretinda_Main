import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { Breadcrumbs } from '@/components/atoms';
import { CategoryHeader } from '@/components/organisms/ProductBrowser/CategoryHeader';
import { ProductListing } from '@/components/organisms/ProductBrowser/ProductListing';
import { ProductListingSkeleton } from '@/components/organisms/ProductListingSkeleton/ProductListingSkeleton';
import { getCategoryByHandle } from '@/lib/data/categories';

type Props = {
	params: Promise<{ category: string; subcategory: string; locale: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const load = async (params: Props['params']) => {
	const { category, subcategory } = await params;
	return Promise.all([getCategoryByHandle([category]), getCategoryByHandle([subcategory])]);
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const [category, subcategory] = await load(params);
	if (!category || !subcategory) return {};
	return {
		description: `Shop ${subcategory.name.toLowerCase()} in our ${category.name.toLowerCase()} section`,
		title: `${subcategory.name} - ${category.name}`,
	};
}

export default async function SubCategory({ params, searchParams }: Props) {
	const [category, subcategory] = await load(params);
	if (!subcategory || !category) return notFound();

	return (
		<main className="mx-auto w-full max-w-[1360px] px-4 pb-20 pt-5 lg:px-6">
			<div className="mb-3 hidden md:block">
				<Breadcrumbs
					items={[
						{ label: 'Home', path: '/' },
						{ label: category.name, path: `/categories/${category.handle}` },
						{ label: subcategory.name, path: `/categories/${category.handle}/${subcategory.handle}` },
					]}
				/>
			</div>
			<CategoryHeader active={subcategory.handle} category={subcategory} parent={category} />
			<div className="mt-8">
				<Suspense fallback={<ProductListingSkeleton />}>
					<ProductListing scope={{ category_id: subcategory.id }} searchParams={await searchParams} />
				</Suspense>
			</div>
		</main>
	);
}
