import Link from 'next/link';

import { listProducts } from '@/lib/data/products';
import type { Product } from '@/types/product';

import { TrendingNowFilters } from './TrendingNowFilters';

const STRIPE = 'repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 14px)';
const BG_COLORS = ['#E8DEF7', '#FFE2D2', '#D9E8F0', '#F4D9E2', '#D9EBDC', '#F0E2C5'];
const BADGES = [
	{ text: 'Bestseller', bg: 'white', color: '#1B1B1B' },
	{ text: 'New', bg: '#432C63', color: 'white' },
	{ text: 'Hot', bg: '#D92D20', color: 'white' },
	{ text: '-35%', bg: '#1B1B1B', color: 'white' },
	null,
	{ text: 'Local pick', bg: 'white', color: '#1B1B1B' },
];
const RATINGS = [4.9, 4.8, 4.7, 4.9, 4.8, 4.9];
const REVIEWS = ['2.3k', '845', '1.1k', '3.4k', '412', '287'];

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

export const TrendingNowSection = async ({
	locale = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'en',
}: { locale?: string }) => {
	const { response: { products } } = await listProducts({
		countryCode: locale,
		queryParams: { limit: 6, order: 'created_at' },
	});

	const items = (products as unknown as Product[]).slice(0, 6);
	if (!items.length) return null;

	return (
		<section style={{ backgroundColor: '#FAF8F5', borderTop: '1px solid #EDEAE3', borderBottom: '1px solid #EDEAE3' }}>
			<div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-10 lg:py-14">
				{/* Header + filters */}
				<div className="flex items-end justify-between flex-wrap gap-4 mb-7">
					<div>
						<div className="text-[12px] font-semibold tracking-[0.18em] uppercase" style={{ color: '#432C63' }}>Right now</div>
						<h2 className="mt-2 font-serif tracking-[-0.01em] text-[#1a1a1a]" style={{ fontSize: '40px' }}>
							Trending in the Philippines
						</h2>
					</div>
					<TrendingNowFilters />
				</div>

				{/* 6-card product grid */}
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
					{items.map((product, i) => {
						const badge = BADGES[i % BADGES.length];
						const bgColor = BG_COLORS[i % BG_COLORS.length];
						const rating = RATINGS[i % RATINGS.length];
						const reviews = REVIEWS[i % REVIEWS.length];

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
									{badge && (
										<span
											className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-md"
											style={{ backgroundColor: badge.bg, color: badge.color }}
										>
											{badge.text}
										</span>
									)}
									<button
										className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 flex items-center justify-center hover:bg-white transition-colors"
										aria-label="Wishlist"
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
											Add to cart
										</div>
									</div>
								</div>

								{/* Info */}
								<div className="p-3">
									<div className="flex items-center gap-1 text-[10.5px] text-[#737373] mb-1">
										<span className="font-semibold uppercase tracking-wider truncate">
											{product.brand || 'Local vendor'}
										</span>
										<VerifiedBadge />
									</div>
									<div className="text-[13.5px] font-semibold leading-snug line-clamp-2 min-h-[38px] text-[#1B1B1B]">
										{product.title}
									</div>
									<div className="mt-1.5 flex items-center gap-1 text-[11px]">
										<StarIcon />
										<span className="font-semibold">{rating}</span>
										<span className="text-[#737373]">({reviews})</span>
									</div>
									<div className="mt-2 flex items-baseline gap-1.5">
										<span className="text-[16px] font-extrabold text-[#1B1B1B]">
											{product.price ? `₱${product.price.toLocaleString()}` : 'View price'}
										</span>
										{product.originalPrice && product.originalPrice > product.price && (
											<span className="text-[11px] line-through text-[#737373]">₱{product.originalPrice.toLocaleString()}</span>
										)}
									</div>
								</div>
							</Link>
						);
					})}
				</div>

				{/* Load more */}
				<div className="mt-8 flex justify-center">
					<Link
						href="/categories"
						className="h-11 px-7 rounded-full border text-[13px] font-bold bg-white text-[#1B1B1B] hover:border-[#432C63] hover:text-[#432C63] transition-colors"
						style={{ borderColor: 'rgba(27,27,27,0.15)' }}
					>
						Load more products
					</Link>
				</div>
			</div>
		</section>
	);
};
