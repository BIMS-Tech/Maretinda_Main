import { HomeText } from '@/i18n/HomeText';
import { listCategories } from '@/lib/data/categories';
import { getTrendingProducts } from '@/lib/data/trending';

import { TrendingNowFilters, type TrendingFilter } from './TrendingNowFilters';
import { TrendingNowClient } from './TrendingNowClient';

export const TrendingNowSection = async ({
	searchParams,
}: {
	searchParams?: { [key: string]: string | string[] | undefined };
}) => {
	const category = (searchParams?.trend_cat as string) || 'all';

	const [products, { categories }] = await Promise.all([
		getTrendingProducts({ category, limit: 12 }),
		listCategories(),
	]);

	// Hide the whole section only when there's genuinely nothing to show on the
	// default view. When a category filter is active we keep the section (and its
	// filter bar) mounted so the user can switch back or pick another category.
	const isFiltered = category !== 'all';
	if (!products.length && !isFiltered) return null;

	// Build the filter bar from the real top-level categories in the catalog,
	// always leading with "All". Handles must match product_category.handle.
	const filters: TrendingFilter[] = [
		{ label: 'All', handle: 'all' },
		...categories
			.filter((c) => c.handle)
			.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
			.map((c) => ({ label: c.name, handle: c.handle as string })),
	];

	return (
		<section style={{ backgroundColor: '#FAF8F5', borderTop: '1px solid #EDEAE3', borderBottom: '1px solid #EDEAE3' }}>
			<div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-10 lg:py-14">
				<div className="flex items-end justify-between flex-wrap gap-4 mb-7">
					<div>
						<div className="text-[12px] font-semibold tracking-[0.18em] uppercase" style={{ color: '#432C63' }}>
							<HomeText k="trendingLabel" />
						</div>
						<h2 className="mt-2 font-serif tracking-[-0.01em] text-[#1a1a1a]" style={{ fontSize: '40px' }}>
							<HomeText k="trendingHeading" />
						</h2>
					</div>
					<TrendingNowFilters activeCategory={category} filters={filters} />
				</div>

				<TrendingNowClient products={products} />
			</div>
		</section>
	);
};
