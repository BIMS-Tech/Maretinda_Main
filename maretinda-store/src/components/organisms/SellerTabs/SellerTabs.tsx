import { Suspense } from 'react';

import { SellerReviewTab } from '@/components/cells';
import { TabsContent } from '@/components/molecules';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { ReelsSection } from '@/components/sections/ReelsSection/ReelsSection';
import type { SellerProps } from '@/types/seller';

import { ProductListing } from '../ProductBrowser/ProductListing';
import { ProductListingSkeleton } from '../ProductListingSkeleton/ProductListingSkeleton';

export const SellerTabs = async ({
	tab,
	seller,
	searchParams,
}: {
	tab: string;
	seller: SellerProps;
	searchParams?: Record<string, string | string[] | undefined>;
}) => {
	const tabLinks = [
		{ label: 'products', link: `/sellers/${seller.handle}` },
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
						<LocalizedClientLink
							aria-current={isActive ? 'page' : undefined}
							className="relative -mb-px px-4 py-2.5 text-[13.5px] font-bold capitalize transition-colors hover:text-[#432C63]"
							href={link}
							key={label}
							scroll={false}
							style={{ color: isActive ? '#432C63' : '#737373' }}
						>
							{label}
							<span
								aria-hidden="true"
								className="absolute inset-x-2 bottom-0 h-[2.5px] origin-left rounded-full bg-[#432C63] transition-transform duration-500 ease-soft"
								style={{ transform: `scaleX(${isActive ? 1 : 0})` }}
							/>
						</LocalizedClientLink>
					);
				})}
			</div>

			<TabsContent activeTab={tab} value="products">
				<Suspense fallback={<ProductListingSkeleton />}>
					<ProductListing
						emptyHref="/sellers"
						hideFilters={['store']}
						scope={{ seller: seller.handle }}
						searchParams={searchParams}
					/>
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
