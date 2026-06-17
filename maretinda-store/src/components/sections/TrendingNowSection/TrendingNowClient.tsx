'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useLanguage } from '@/providers/LanguageProvider';
import type { TrendingProduct } from '@/lib/data/trending';

const STRIPE = 'repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 14px)';
const BG_COLORS = ['#E8DEF7', '#FFE2D2', '#D9E8F0', '#F4D9E2', '#D9EBDC', '#F0E2C5'];

const VerifiedBadge = () => (
	<svg width="10" height="10" viewBox="0 0 24 24" fill="#7FA8C9">
		<circle cx="12" cy="12" r="12" />
		<path d="M7 12l3.5 3.5L17 9" stroke="white" strokeWidth="2.5" fill="none" />
	</svg>
);

const StarIcon = () => (
	<svg width="11" height="11" viewBox="0 0 24 24" fill="#FFC533">
		<path d="M12 2l3 7h7l-5.5 4.5L18 22l-6-4-6 4 1.5-8.5L2 9h7z" />
	</svg>
);

function formatReviewCount(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
	return String(n);
}

export function TrendingNowClient({ products }: { products: TrendingProduct[] }) {
	const { t } = useLanguage();
	const INITIAL_COUNT = 6;
	const [shown, setShown] = useState(INITIAL_COUNT);
	const [loading, setLoading] = useState(false);

	const visible = products.slice(0, shown);
	const hasMore = shown < products.length;

	if (!products.length) {
		return (
			<div
				className="rounded-2xl border text-center py-14 px-6"
				style={{ borderColor: '#EDEAE3', backgroundColor: 'white' }}
			>
				<div className="text-[15px] font-semibold text-[#1B1B1B]">
					Nothing trending here yet
				</div>
				<div className="mt-1.5 text-[13px] text-[#737373]">
					There are no trending products in this category right now. Try another category.
				</div>
			</div>
		);
	}

	function handleLoadMore() {
		setLoading(true);
		setTimeout(() => {
			setShown((n) => Math.min(n + 6, products.length));
			setLoading(false);
		}, 400);
	}

	return (
		<>
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
				{visible.map((product, i) => {
					const bgColor = BG_COLORS[i % BG_COLORS.length];
					const hasRating = product.avg_rating && product.avg_rating > 0;

					return (
						<Link
							key={product.id}
							href={`/products/${product.handle}`}
							className="group bg-white rounded-2xl border overflow-hidden block transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
							style={{ borderColor: '#EDEAE3' }}
						>
							{/* Image */}
							<div
								className="aspect-[4/5] relative"
								style={{ backgroundColor: bgColor, backgroundImage: STRIPE }}
							>
								{product.thumbnail && (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={product.thumbnail} alt={product.title} className="absolute inset-0 w-full h-full object-cover" />
								)}
								{/* Hot badge for top sellers */}
								{i === 0 && product.trending_score > 0 && (
									<span
										className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-md"
										style={{ backgroundColor: '#D92D20', color: 'white' }}
									>
										Hot
									</span>
								)}
								<button
									className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 flex items-center justify-center hover:bg-white transition-colors"
									aria-label={t.product.addToWishlist}
								>
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1B1B1B" strokeWidth="1.8">
										<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
									</svg>
								</button>
								{/* Hover add-to-cart */}
								<div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
									<div
										className="w-full h-9 rounded-full text-white text-[12px] font-bold flex items-center justify-center"
										style={{ backgroundColor: '#432C63' }}
									>
										{t.product.addToCart}
									</div>
								</div>
							</div>

							{/* Info */}
							<div className="p-3">
								<div className="flex items-center gap-1 text-[10.5px] text-[#737373] mb-1">
									<VerifiedBadge />
									<span className="font-semibold uppercase tracking-wider truncate">
										Verified seller
									</span>
								</div>
								<div className="text-[13.5px] font-semibold leading-snug line-clamp-2 min-h-[38px] text-[#1B1B1B]">
									{product.title}
								</div>
								{hasRating ? (
									<div className="mt-1.5 flex items-center gap-1 text-[11px]">
										<StarIcon />
										<span className="font-semibold">{product.avg_rating!.toFixed(1)}</span>
										{product.review_count > 0 && (
											<span className="text-[#737373]">({formatReviewCount(product.review_count)})</span>
										)}
									</div>
								) : (
									<div className="mt-1.5 h-[17px]" />
								)}
								<div className="mt-2">
									<span className="text-[13px] font-bold text-[#432C63]">
										{t.product.viewPrice}
									</span>
								</div>
							</div>
						</Link>
					);
				})}
			</div>

			{hasMore && (
				<div className="mt-8 flex justify-center">
					<button
						onClick={handleLoadMore}
						disabled={loading}
						className="h-11 px-8 rounded-full font-bold text-[13.5px] text-white flex items-center gap-2.5 transition-opacity hover:opacity-90 disabled:opacity-60"
						style={{ backgroundColor: '#432C63' }}
					>
						{loading ? (
							<>
								<svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
									<path d="M21 12a9 9 0 1 1-6.219-8.56" />
								</svg>
								{t.pagination.loading}
							</>
						) : (
							<>
								{t.home.loadMore}
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
									<path d="M5 12h14M13 5l7 7-7 7" />
								</svg>
							</>
						)}
					</button>
				</div>
			)}
		</>
	);
}
