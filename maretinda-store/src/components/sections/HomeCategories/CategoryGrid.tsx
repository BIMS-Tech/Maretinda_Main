'use client';

import type { HttpTypes } from '@medusajs/types';
import Link from 'next/link';
import { useState } from 'react';

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

// Categories shown before the "Browse more" button is needed.
const INITIAL_COUNT = 6;

export const CategoryGrid = ({ items }: { items: HttpTypes.StoreProductCategory[] }) => {
	const [expanded, setExpanded] = useState(false);

	const hasMore = items.length > INITIAL_COUNT;
	const visible = expanded ? items : items.slice(0, INITIAL_COUNT);

	return (
		<>
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3 lg:gap-4">
				{visible.map((category, i) => {
					const color =
						TILE_COLORS[category.handle] ??
						TILE_COLORS[category.name.toLowerCase().replace(/\s+/g, '-')] ??
						FALLBACK_COLORS[i % FALLBACK_COLORS.length];

					const imageUrl = (() => {
						const url = category.metadata?.image_url as string | undefined;
						return url && url.startsWith('http') ? url : null;
					})();

					return (
						<Link key={category.id} href={`/categories/${category.handle}`} className="group">
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

			{hasMore && (
				<div className="mt-7 flex justify-center">
					<button
						type="button"
						onClick={() => setExpanded((v) => !v)}
						className="inline-flex items-center gap-2 h-11 px-6 rounded-full border text-[13.5px] font-bold transition-colors hover:bg-[#432C63]/5"
						style={{ borderColor: '#E0D8EC', color: '#432C63' }}
						aria-expanded={expanded}
					>
						{expanded ? 'Show less' : `Browse more categories`}
						<svg
							width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
							className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
						>
							<path d="M6 9l6 6 6-6" />
						</svg>
					</button>
				</div>
			)}
		</>
	);
};
