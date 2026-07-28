import { Suspense } from 'react';

import { SellerReviewTab } from '@/components/cells';
import { TabsContent } from '@/components/molecules';
import { AlgoliaProductsListing, ProductListing } from '@/components/sections';
import { ReelsSection } from '@/components/sections/ReelsSection/ReelsSection';
import type { SellerProps } from '@/types/seller';

import { ProductListingSkeleton } from '../ProductListingSkeleton/ProductListingSkeleton';

const ALGOLIA_ID = process.env.NEXT_PUBLIC_ALGOLIA_ID;
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

const TAB_ITEMS = [
	{ label: 'Products', value: 'products' },
	{ label: 'Reviews', value: 'reviews' },
];

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
	const tabLinks = [
		{ label: 'products', link: `/sellers/${seller.handle}/` },
		{ label: 'reels', link: `/sellers/${seller.handle}/reels` },
		{ label: 'reviews', link: `/sellers/${seller.handle}/reviews` },
	];

	return (
		<div className="mt-6">
			{/* Tab pills */}
			<div className="flex gap-2 mb-6 border-b pb-0" style={{ borderColor: '#EDEAE3' }}>
				{tabLinks.map(({ label, link }) => {
					const isActive = tab === label;
					return (
						<a
							key={label}
							href={link}
							className="px-4 py-2.5 text-[13.5px] font-bold capitalize rounded-t-lg transition-colors -mb-px"
							style={{
								color: isActive ? '#432C63' : '#737373',
								borderBottom: isActive ? '2px solid #432C63' : '2px solid transparent',
								backgroundColor: isActive ? 'rgba(67,44,99,0.04)' : 'transparent',
							}}
						>
							{label.charAt(0).toUpperCase() + label.slice(1)}
						</a>
					);
				})}
			</div>

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
			<TabsContent activeTab={tab} value="reels">
				<Suspense>
					<ReelsSection
						heading={`Reels from ${seller.name}`}
						hideWhenEmpty={false}
						limit={30}
						seller_id={seller.id}
						subheading="Watch products in action, then message the seller"
					/>
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
