import { Suspense } from 'react';

import NotFound from '@/app/not-found';
import { Breadcrumbs } from '@/components/atoms';
import { ProductListingSkeleton } from '@/components/organisms/ProductListingSkeleton/ProductListingSkeleton';
import { AlgoliaProductsListing, ProductListing } from '@/components/sections';
import { getCollectionByHandle } from '@/lib/data/collections';

const ALGOLIA_ID = process.env.NEXT_PUBLIC_ALGOLIA_ID;
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

const SingleCollectionsPage = async ({
	params,
}: {
	params: Promise<{ handle: string; locale: string }>;
}) => {
	const { handle, locale } = await params;

	const collection = await getCollectionByHandle(handle);

	if (!collection) return <NotFound />;

	const breadcrumbsItems = [
		{
			label: collection.title,
			path: collection.handle,
		},
	];

	return (
		<main className="container !max-w-7xl mx-auto">
			<div className="hidden md:block mb-2">
				<Breadcrumbs items={breadcrumbsItems} />
			</div>

			<h1 className="heading-xl uppercase">{collection.title}</h1>

			<Suspense fallback={<ProductListingSkeleton />}>
				{!ALGOLIA_ID || !ALGOLIA_SEARCH_KEY ? (
					<ProductListing collection_id={collection.id} showSidebar />
				) : (
					<AlgoliaProductsListing
						collection_id={collection.id}
						locale={locale}
					/>
				)}
			</Suspense>
		</main>
	);
};

export default SingleCollectionsPage;
