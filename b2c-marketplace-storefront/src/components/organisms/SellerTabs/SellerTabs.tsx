import { Suspense } from 'react';

import { SellerReviewTab } from '@/components/cells';
import { TabsContent, TabsList } from '@/components/molecules';
import { AlgoliaProductsListing, ProductListing } from '@/components/sections';

import { ProductListingSkeleton } from '../ProductListingSkeleton/ProductListingSkeleton';

const ALGOLIA_ID = process.env.NEXT_PUBLIC_ALGOLIA_ID;
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

export const SellerTabs = ({
	tab,
	seller_handle,
	seller_id,
	locale,
	currency_code,
}: {
	tab: string;
	seller_handle: string;
	seller_id: string;
	locale: string;
	currency_code?: string;
}) => {
	const tabsList = [
		{ label: 'products', link: `/sellers/${seller_handle}/` },
		{
			label: 'reviews',
			link: `/sellers/${seller_handle}/reviews`,
		},
	];

	return (
		<div className="mt-8">
			<TabsList activeTab={tab} list={tabsList} />
			<TabsContent activeTab={tab} value="products">
				<Suspense fallback={<ProductListingSkeleton />}>
					{!ALGOLIA_ID || !ALGOLIA_SEARCH_KEY ? (
						<ProductListing seller_id={seller_id} showSidebar />
					) : (
						<AlgoliaProductsListing
							currency_code={currency_code}
							locale={locale}
							seller_handle={seller_handle}
						/>
					)}
				</Suspense>
			</TabsContent>
			<TabsContent activeTab={tab} value="reviews">
				<Suspense>
					<SellerReviewTab seller_handle={seller_handle} />
				</Suspense>
			</TabsContent>
		</div>
	);
};
