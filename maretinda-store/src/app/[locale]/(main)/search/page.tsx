import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ProductListing } from '@/components/organisms/ProductBrowser/ProductListing';
import { SearchHeading } from '@/components/organisms/ProductBrowser/SearchHeading';
import { ProductListingSkeleton } from '@/components/organisms/ProductListingSkeleton/ProductListingSkeleton';
import { readListing, toSearchParams } from '@/lib/listing';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
	const { q } = readListing(toSearchParams(await searchParams));
	return {
		// Every possible search isn't a page worth indexing
		robots: { follow: true, index: false },
		title: q ? `“${q}”` : 'Search',
	};
}

export default async function SearchPage({ searchParams }: Props) {
	const params = await searchParams;
	return (
		<main className="mx-auto w-full max-w-[1360px] px-4 pb-20 pt-8 lg:px-6 lg:pt-10">
			<SearchHeading />
			<Suspense fallback={<ProductListingSkeleton />}>
				<ProductListing searchParams={params} />
			</Suspense>
		</main>
	);
}
