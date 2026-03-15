import type { Metadata } from 'next';

import { Breadcrumbs } from '@/components/atoms';
import { ProductDetailsPage } from '@/components/sections';
import { listProducts } from '@/lib/data/products';
import { generateProductMetadata } from '@/lib/helpers/seo';

export async function generateMetadata({
	params,
}: {
	params: Promise<{ handle: string; locale: string }>;
}): Promise<Metadata> {
	const { handle, locale } = await params;

	const prod = await listProducts({
		countryCode: locale,
		queryParams: { handle },
	}).then(({ response }) => response.products[0]);

	return generateProductMetadata(prod);
}

export default async function ProductPage({
	params,
}: {
	params: Promise<{ handle: string; locale: string }>;
}) {
	const { handle, locale } = await params;
	// Legacy category handling
	// const category = await getCategoryByHandle([handle]);

	// if (!category) {
	// 	return notFound();
	// }

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
			label: handle,
			path: `/categories/${handle}`,
		},
	];

	return (
		<main className="container !max-w-7xl mx-auto">
			<div className="hidden md:block mb-7">
				<Breadcrumbs items={breadcrumbsItems} />
			</div>
			<ProductDetailsPage handle={handle} locale={locale} />
		</main>
	);
}
