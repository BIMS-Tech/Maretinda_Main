import type { HttpTypes } from '@medusajs/types';
import Link from 'next/link';

import { listCategories } from '@/lib/data/categories';

import { CategoryGrid } from './CategoryGrid';

export const HomeCategories = async (_: { heading: string }) => {
	const { categories } = (await listCategories()) as {
		categories: HttpTypes.StoreProductCategory[];
	};

	let items: HttpTypes.StoreProductCategory[] = [];
	categories.forEach((cat) => {
		if (cat.category_children?.length) {
			items = [...items, ...cat.category_children];
		}
	});
	if (!items.length) items = categories;

	const displayed = items.slice(0, 18);
	if (!displayed.length) return null;

	return (
		<section className="bg-white">
			<div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-10 lg:py-14">
				{/* Header */}
				<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-4 mb-7 lg:mb-8">
					<div>
						<div className="text-[12px] font-semibold tracking-[0.18em] uppercase" style={{ color: '#432C63' }}>
							Browse the marketplace
						</div>
						<h2 className="mt-2 text-[26px] lg:text-[32px] font-extrabold tracking-tight text-[#1B1B1B]">
							Shop by category
						</h2>
					</div>
					<Link
						href="/categories"
						className="text-[13px] font-bold flex items-center gap-1.5 hover:gap-2.5 transition-all shrink-0"
						style={{ color: '#432C63' }}
					>
						See all categories
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
							<path d="M5 12h14M13 5l7 7-7 7" />
						</svg>
					</Link>
				</div>

				{/* Category tiles — shows 6, with a Browse more toggle */}
				<CategoryGrid items={displayed} />
			</div>
		</section>
	);
};
