import { HomeText } from '@/i18n/HomeText';
import { listProducts } from '@/lib/data/products';
import type { Product } from '@/types/product';

import { TrendingNowFilters } from './TrendingNowFilters';
import { TrendingNowClient } from './TrendingNowClient';

export const TrendingNowSection = async ({
	locale = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'en',
}: { locale?: string }) => {
	const { response: { products } } = await listProducts({
		countryCode: locale,
		queryParams: { limit: 12, order: 'created_at' },
	});

	const items = (products as unknown as Product[]).slice(0, 12);
	if (!items.length) return null;

	return (
		<section style={{ backgroundColor: '#FAF8F5', borderTop: '1px solid #EDEAE3', borderBottom: '1px solid #EDEAE3' }}>
			<div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-10 lg:py-14">
				{/* Header + filters */}
				<div className="flex items-end justify-between flex-wrap gap-4 mb-7">
					<div>
						<div className="text-[12px] font-semibold tracking-[0.18em] uppercase" style={{ color: '#432C63' }}>
							<HomeText k="trendingLabel" />
						</div>
						<h2 className="mt-2 font-serif tracking-[-0.01em] text-[#1a1a1a]" style={{ fontSize: '40px' }}>
							<HomeText k="trendingHeading" />
						</h2>
					</div>
					<TrendingNowFilters />
				</div>

				<TrendingNowClient products={items} />
			</div>
		</section>
	);
};
