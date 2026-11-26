import { HomeHeading } from '@/i18n/HomeHeading';
import { listCategories } from '@/lib/data/categories';
import { retrieveCustomer } from '@/lib/data/customer';
import { searchProductsOrNothing } from '@/lib/data/search';
import { getUserWishlists } from '@/lib/data/wishlist';

import { TrendingNowClient } from './TrendingNowClient';

const LIMIT = 12;

export const TrendingNowSection = async () => {
	const [popular, { categories }, user] = await Promise.all([
		searchProductsOrNothing(`sort=popular&in_stock=1&limit=${LIMIT}`),
		listCategories(),
		retrieveCustomer(),
	]);
	if (!popular.products.length) return null;
	const wishlist = user ? await getUserWishlists().then((r) => r.wishlists).catch(() => []) : [];

	// Only categories with something in them, by the shop's own order
	const stocked = new Set(popular.facets.find((f) => f.name === 'category')?.values.map((v) => v.value) ?? []);
	const filters = [...categories]
		.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
		.filter((c) => stocked.has(c.handle.trim()) || c.category_children?.some((child) => stocked.has(child.handle.trim())))
		.slice(0, 7)
		.map((c) => ({ handle: c.handle.trim(), id: c.id, label: c.name }));

	return (
		<section className="scroll-mt-24" id="trending" style={{ backgroundColor: '#FAF8F5', borderBottom: '1px solid #EDEAE3', borderTop: '1px solid #EDEAE3' }}>
			<div className="mx-auto max-w-[1360px] px-4 py-12 lg:px-6 lg:py-16">
				<TrendingNowClient
					filters={filters}
					heading={
						<HomeHeading
							className="font-serif text-[34px] leading-tight tracking-[-0.01em] text-[#1a1a1a] lg:text-[42px]"
							eyebrow="trendingLabel"
							k="trendingHeading"
						/>
					}
					initial={popular.products}
					limit={LIMIT}
					user={user}
					wishlist={wishlist}
				/>
			</div>
		</section>
	);
};
