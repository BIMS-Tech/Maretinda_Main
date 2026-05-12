import Link from 'next/link';

import { listProducts } from '@/lib/data/products';
import type { Product } from '@/types/product';

import { FlashSaleCountdown } from './FlashSaleCountdown';

const PLACEHOLDER_COLORS = ['#FFE0D9', '#E0E9F2', '#F0E5D2', '#D8EAD9', '#F5DEE9', '#E8DEF7'];

// Mock discount rates applied visually (real discounts would come from promotions API)
const DISCOUNTS = [62, 45, 30, 55, 40, 35];
const SOLD_PCT = [72, 88, 54, 91, 66, 43];

export const FlashSaleSection = async ({
	locale = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'en',
}: {
	locale?: string;
}) => {
	const { response: { products } } = await listProducts({
		countryCode: locale,
		queryParams: { limit: 6, order: 'created_at' },
	});

	const items = (products as unknown as Product[]).slice(0, 6);
	if (!items.length) return null;

	return (
		<section style={{ backgroundColor: '#FAF8F5', borderTop: '1px solid #EDEAE3', borderBottom: '1px solid #EDEAE3' }}>
			<div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-10 lg:py-12">

				{/* Section header */}
				<div className="flex items-end justify-between flex-wrap gap-4 mb-7">
					<div className="flex items-end gap-5 flex-wrap">
						<div>
							<div className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.16em] uppercase text-red-600">
								<span className="relative flex w-2 h-2">
									<span className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-75" />
									<span className="relative inline-block w-2 h-2 rounded-full bg-red-600" />
								</span>
								Happening now
							</div>
							<h2 className="mt-2 text-[28px] lg:text-[32px] font-extrabold tracking-tight flex items-center gap-3">
								<svg width="26" height="26" viewBox="0 0 24 24" fill="#1B1B1B" stroke="none">
									<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
								</svg>
								Flash Sale
							</h2>
						</div>
						<FlashSaleCountdown />
					</div>

					<div className="flex items-center gap-2">
						<Link
							href="/categories"
							className="text-[13px] font-bold flex items-center gap-1.5 hover:underline"
							style={{ color: '#432C63' }}
						>
							Shop all deals →
						</Link>
					</div>
				</div>

				{/* Product cards */}
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
					{items.map((product, i) => {
						const discountPct = DISCOUNTS[i % DISCOUNTS.length];
						const soldPct = SOLD_PCT[i % SOLD_PCT.length];
						const remaining = Math.round((100 - soldPct) * 0.8);
						const bgColor = PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length];
						const salePrice = product.price
							? Math.round(product.price * (1 - discountPct / 100))
							: null;

						return (
							<Link
								key={product.id}
								href={`/products/${product.id}`}
								className="group bg-white rounded-2xl border overflow-hidden block transition-all duration-200 hover:-translate-y-0.5"
								style={{ borderColor: '#EDEAE3', boxShadow: '0 1px 2px rgba(20,20,20,0.04)' }}
							>
								{/* Image area */}
								<div
									className="aspect-square relative"
									style={{
										backgroundColor: bgColor,
										backgroundImage: 'repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 14px)',
									}}
								>
									{product.thumbnail && (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={product.thumbnail}
											alt={product.title}
											className="absolute inset-0 w-full h-full object-cover"
										/>
									)}
									<span className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md">
										-{discountPct}%
									</span>
									<button
										className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
										aria-label="Add to wishlist"
									>
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1B1B1B" strokeWidth="1.8">
											<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
										</svg>
									</button>
								</div>

								{/* Info */}
								<div className="p-3">
									<div className="text-[13px] font-semibold leading-snug line-clamp-2 min-h-[36px] text-[#1B1B1B]">
										{product.title}
									</div>
									<div className="mt-2 flex items-baseline gap-1.5">
										{salePrice ? (
											<>
												<span className="text-[16px] font-extrabold text-red-600">
													₱{salePrice.toLocaleString()}
												</span>
												<span className="text-[11px] line-through text-[#737373]">
													₱{product.price?.toLocaleString()}
												</span>
											</>
										) : (
											<span className="text-[16px] font-extrabold text-[#1B1B1B]">
												{product.price ? `₱${product.price.toLocaleString()}` : 'View price'}
											</span>
										)}
									</div>
									{/* Sold progress bar */}
									<div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(27,27,27,0.10)' }}>
										<div className="h-full rounded-full bg-[#1B1B1B]" style={{ width: `${soldPct}%` }} />
									</div>
									<div className="mt-1 text-[10.5px] text-[#737373] font-medium">
										{soldPct}% sold · {remaining} left
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
