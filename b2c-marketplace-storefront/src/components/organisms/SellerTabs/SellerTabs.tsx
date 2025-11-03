import { Suspense } from 'react';

import { SellerReviewTab } from '@/components/cells';
import { TabsContent, TabsList } from '@/components/molecules';
import { AlgoliaProductsListing, ProductListing } from '@/components/sections';
import type { SellerProps } from '@/types/seller';

import { ProductListingSkeleton } from '../ProductListingSkeleton/ProductListingSkeleton';

const ALGOLIA_ID = process.env.NEXT_PUBLIC_ALGOLIA_ID;
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

export const SellerTabs = async ({
	tab,
	seller,
	locale,
	currency_code,
}: {
	tab: string;
	seller: SellerProps;
	locale: string;
	currency_code?: string;
}) => {
	const tabsList = [
		{ label: 'products', link: `/sellers/${seller.handle}/` },
		{
			label: 'reviews',
			link: `/sellers/${seller.handle}/reviews`,
		},
	];

	return (
		<div className="mt-8">
			<TabsList
				activeTab={tab}
				className="w-[225px] justify-between text-base font-bold"
				list={tabsList}
			/>
			<TabsContent activeTab={tab} value="products">
				<Suspense fallback={<ProductListingSkeleton />}>
					{!ALGOLIA_ID || !ALGOLIA_SEARCH_KEY ? (
						<ProductListing seller_id={seller.id} showSidebar />
					) : (
						<AlgoliaProductsListing
							currency_code={currency_code}
							locale={locale}
							seller_handle={seller.handle}
						/>
					)}
				</Suspense>
			</TabsContent>
			<TabsContent activeTab={tab} value="reviews">
				<Suspense>
					<SellerReviewTab seller={seller} />
				</Suspense>
			</TabsContent>
		</div>
	);
};
