import Link from 'next/link';

import { getActiveFlashSale } from '@/lib/data/flash-sales';
import { FlashSaleCountdown } from './FlashSaleCountdown';

const PLACEHOLDER_COLORS = ['#FFE0D9', '#E0E9F2', '#F0E5D2', '#D8EAD9', '#F5DEE9', '#E8DEF7'];

export const FlashSaleSection = async ({
	locale = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'en',
}: {
	locale?: string;
}) => {
	const sale = await getActiveFlashSale();
	if (!sale || !sale.items?.length) return null;

	const items = sale.items.slice(0, 6);

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
							<Link href="/flash-sale">
							<h2 className="mt-2 font-serif tracking-[-0.01em] flex items-center gap-3 hover:opacity-80 transition-opacity" style={{ fontSize: '40px' }}>
								<svg width="26" height="26" viewBox="0 0 24 24" fill="#FFC533" stroke="none">
									<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
								</svg>
								{sale.title || 'Flash Sale'}
							</h2>
						</Link>
						</div>
						<FlashSaleCountdown endsAt={sale.ends_at} />
					</div>

					<div className="flex items-center gap-2">
						<Link
							href="/flash-sale"
							className="text-[13px] font-bold flex items-center gap-1.5 hover:underline"
							style={{ color: '#432C63' }}
						>
							Shop all deals →
						</Link>
					</div>
				</div>

				{/* Product cards */}
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
					{items.map((item, i) => {
						const product = item.product;
						if (!product) return null;

						const discountPct =
							item.discount_type === 'percentage' ? item.discount_value : null;
						const soldPct = item.stock_limit
							? Math.min(100, Math.round((item.sold_count / item.stock_limit) * 100))
							: 0;
						const remaining = item.stock_limit
							? Math.max(0, item.stock_limit - item.sold_count)
							: null;
						const bgColor = PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length];

						// Compute base price from first variant
						const variants = product.variants || [];
						const firstVariant = variants[0];
						const basePrice = firstVariant?.prices?.[0]?.amount
							? firstVariant.prices[0].amount / 100
							: null;

						const salePrice =
							basePrice !== null
								? item.discount_type === 'percentage'
									? Math.round(basePrice * (1 - item.discount_value / 100))
									: Math.max(0, Math.round(basePrice - item.discount_value))
								: null;

						return (
							<Link
								key={item.id}
								href={`/products/${product.handle}`}
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
									{discountPct && (
										<span className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md">
											-{discountPct}%
										</span>
									)}
									{item.discount_type === 'fixed' && (
										<span className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md">
											-₱{item.discount_value}
										</span>
									)}
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
										{salePrice !== null ? (
											<>
												<span className="text-[16px] font-extrabold text-red-600">
													₱{salePrice.toLocaleString()}
												</span>
												{basePrice !== null && (
													<span className="text-[11px] line-through text-[#737373]">
														₱{basePrice.toLocaleString()}
													</span>
												)}
											</>
										) : (
											<span className="text-[16px] font-extrabold text-[#1B1B1B]">
												View price
											</span>
										)}
									</div>

									{/* Sold progress bar — only shown when stock_limit is set */}
									{item.stock_limit !== null && item.stock_limit > 0 && (
										<>
											<div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,197,51,0.20)' }}>
												<div className="h-full rounded-full" style={{ width: `${soldPct}%`, backgroundColor: '#FFC533' }} />
											</div>
											<div className="mt-1 text-[10.5px] text-[#737373] font-medium">
												{soldPct}% sold{remaining !== null ? ` · ${remaining} left` : ''}
											</div>
										</>
									)}
								</div>
							</Link>
						);
					})}
				</div>
			</div>
		</section>
	);
};
