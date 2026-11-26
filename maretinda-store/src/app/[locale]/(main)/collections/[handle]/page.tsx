import type { Metadata } from 'next';
import { Suspense } from 'react';

import NotFound from '@/app/not-found';
import { Breadcrumbs } from '@/components/atoms';
import { MaskedText } from '@/components/motion';
import { ProductListing } from '@/components/organisms/ProductBrowser/ProductListing';
import { ProductListingSkeleton } from '@/components/organisms/ProductListingSkeleton/ProductListingSkeleton';
import { getCollectionByHandle } from '@/lib/data/collections';

type Props = {
	params: Promise<{ handle: string; locale: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const collection = await getCollectionByHandle((await params).handle);
	return collection ? { title: collection.title } : {};
}

export default async function SingleCollectionsPage({ params, searchParams }: Props) {
	const { handle } = await params;
	const collection = await getCollectionByHandle(handle);
	if (!collection) return <NotFound />;

	return (
		<main className="mx-auto w-full max-w-[1360px] px-4 pb-20 pt-5 lg:px-6">
			<div className="mb-3 hidden md:block">
				<Breadcrumbs
					items={[
						{ label: 'Home', path: '/' },
						{ label: 'Collections', path: '/collections' },
						{ label: collection.title, path: `/collections/${collection.handle}` },
					]}
				/>
			</div>
			<h1 className="mb-8 font-serif text-[38px] leading-tight tracking-[-0.01em] text-[#1B1B1B] lg:text-[52px]">
				<MaskedText play text={collection.title} />
			</h1>
			<Suspense fallback={<ProductListingSkeleton />}>
				<ProductListing emptyHref="/collections" scope={{ collection_id: collection.id }} searchParams={await searchParams} />
			</Suspense>
		</main>
	);
}
