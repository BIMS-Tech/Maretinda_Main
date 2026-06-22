import type { HttpTypes } from '@medusajs/types';
import Link from 'next/link';

import { listCategories } from '@/lib/data/categories';

const TILE_COLORS: Record<string, string> = {
	groceries:       '#E6DFC9',
	'food-drinks':   '#FFD9D2',
	'food-beverage': '#FFD9D2',
	fashion:         '#E8DEF7',
	electronics:     '#D9E6F2',
	beauty:          '#F5DEE9',
	'home-living':   '#D8EAD9',
	mobile:          '#E0DBD0',
	'baby-kids':     '#FCE6CF',
	health:          '#CEE3DC',
	'sari-sari':     '#E2D9C7',
};

const FALLBACK_COLORS = [
	'#E6DFC9', '#FFD9D2', '#E8DEF7', '#D9E6F2', '#F5DEE9',
	'#D8EAD9', '#E0DBD0', '#FCE6CF', '#CEE3DC', '#E2D9C7',
];

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

	const displayed = items.slice(0, 10);
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

				{/* Category tile grid — comfortably sized, adapts to item count */}
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3 lg:gap-4">
					{displayed.map((category, i) => {
						const color =
							TILE_COLORS[category.handle] ??
							TILE_COLORS[category.name.toLowerCase().replace(/\s+/g, '-')] ??
							FALLBACK_COLORS[i % FALLBACK_COLORS.length];

						const imageUrl = (() => {
							const url = category.metadata?.image_url as string | undefined;
							return url && url.startsWith('http') ? url : null;
						})();

						return (
							<Link
								key={category.id}
								href={`/categories/${category.handle}`}
								className="group"
							>
								<div
									className="aspect-square rounded-[14px] overflow-hidden relative border transition-all duration-300 group-hover:shadow-md"
									style={{ borderColor: '#EDEAE3', backgroundColor: '#FAF8F5' }}
								>
									{/* Colored bg with stripe pattern */}
									<div
										className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.04]"
										style={{
											backgroundColor: color,
											backgroundImage: 'repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 14px)',
										}}
									/>
									{/* Real image if available */}
									{imageUrl && (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={imageUrl}
											alt={category.name}
											className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
										/>
									)}
									{/* Label */}
									<div
										className="absolute inset-x-0 bottom-0 px-2.5 pb-2.5 pt-6 text-[12.5px] lg:text-[13px] font-semibold text-[#1B1B1B] leading-tight line-clamp-2"
										style={{ background: 'linear-gradient(to top, white 55%, rgba(255,255,255,0.9) 80%, transparent 100%)' }}
									>
										{category.name}
									</div>
								</div>
							</Link>
						);
					})}
				</div>
			</div>
		</section>
	);
};
