import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getActiveFlashSale } from '@/lib/data/flash-sales';
import { FlashSaleCountdown } from '@/components/sections/FlashSaleSection/FlashSaleCountdown';

export const metadata: Metadata = {
	title: 'Flash Sale — Maretinda',
	description: 'Limited-time deals with massive discounts. Shop now before the sale ends!',
};

const PLACEHOLDER_COLORS = ['#FFE0D9', '#E0E9F2', '#F0E5D2', '#D8EAD9', '#F5DEE9', '#E8DEF7', '#FFF3D9', '#D9F0EA'];

export const revalidate = 30;

export default async function FlashSalePage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	await params;
	const sale = await getActiveFlashSale();

	if (!sale || !sale.items?.length) {
		return (
			<main className="w-full min-h-[60vh]">
				{/* Hero */}
				<div
					className="w-full py-12 lg:py-16 relative overflow-hidden"
					style={{ background: 'linear-gradient(135deg, #1A0A2E 0%, #2D1654 60%, #431F7A 100%)' }}
				>
					<div
						className="absolute inset-0"
						style={{ backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 14px)' }}
					/>
					<div className="max-w-[1360px] mx-auto px-4 lg:px-6 relative">
						<div className="flex items-center gap-2 mb-3">
							<Link href="/" className="text-white/50 text-[13px] hover:text-white/80 transition-colors">Home</Link>
							<span className="text-white/30 text-[13px]">/</span>
							<span className="text-white/80 text-[13px]">Flash Sale</span>
						</div>
						<div className="flex items-center gap-3">
							<svg width="32" height="32" viewBox="0 0 24 24" fill="#FFC533" stroke="none">
								<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
							</svg>
							<h1 className="text-[32px] lg:text-[48px] font-extrabold text-white tracking-tight leading-[1.05]">
								Flash Sale
							</h1>
						</div>
					</div>
				</div>

				{/* No active sale */}
				<div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-20 text-center">
					<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" className="mx-auto mb-4">
						<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
					</svg>
					<h2 className="text-2xl font-bold text-gray-800 mb-3">No Flash Sale Right Now</h2>
					<p className="text-gray-500 mb-6 max-w-md mx-auto">
						Stay tuned! Flash sales are announced without warning. Check back soon or browse our regular deals.
					</p>
					<Link
						href="/categories"
						className="inline-block px-6 py-3 rounded-full text-white font-semibold text-sm transition-opacity hover:opacity-90"
						style={{ backgroundColor: '#432C63' }}
					>
						Browse All Products
					</Link>
				</div>
			</main>
		);
	}

	const items = sale.items;

	return (
		<main className="w-full min-h-screen bg-[#FAF8F5]">
			{/* ── Hero banner ── */}
			<div
				className="w-full py-10 lg:py-16 relative overflow-hidden"
				style={{ background: 'linear-gradient(135deg, #1A0A2E 0%, #2D1654 60%, #C0392B 100%)' }}
			>
				{/* seller-supplied banner image — kept crisp on the right, darkened on the left for legible copy */}
				{sale.banner_image && (
					<>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={sale.banner_image}
							alt=""
							aria-hidden
							className="absolute inset-0 w-full h-full object-cover object-center opacity-60 pointer-events-none"
						/>
						{/* Contrast overlay: solid behind the copy (left), transparent over the product photo (right) */}
						<div
							className="absolute inset-0 pointer-events-none"
							style={{ background: 'linear-gradient(90deg, #1A0A2E 0%, rgba(26,10,46,0.85) 35%, rgba(45,22,84,0.45) 70%, rgba(45,22,84,0.15) 100%)' }}
						/>
						{/* Gentle bottom fade so stats stay readable on mobile (stacked layout) */}
						<div
							className="absolute inset-0 pointer-events-none lg:hidden"
							style={{ background: 'linear-gradient(180deg, rgba(26,10,46,0.2) 0%, rgba(26,10,46,0.75) 100%)' }}
						/>
					</>
				)}

				<div
					className="absolute inset-0 pointer-events-none"
					style={{ backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 14px)' }}
				/>

				{/* Decorative large lightning bolt — hidden when banner image is set */}
				{!sale.banner_image && (
					<div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none hidden lg:block">
						<svg width="240" height="240" viewBox="0 0 24 24" fill="white" stroke="none">
							<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
						</svg>
					</div>
				)}

				<div className="max-w-[1360px] mx-auto px-4 lg:px-6 relative">
					{/* Breadcrumb */}
					<div className="flex items-center gap-2 mb-4">
						<Link href="/" className="text-white/50 text-[13px] hover:text-white/80 transition-colors">Home</Link>
						<span className="text-white/30 text-[13px]">/</span>
						<span className="text-white/80 text-[13px]">Flash Sale</span>
					</div>

					<div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
						<div className="max-w-[640px]">
							{/* Live badge */}
							<div className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.16em] uppercase text-red-400 mb-3">
								<span className="relative flex w-2 h-2">
									<span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
									<span className="relative inline-block w-2 h-2 rounded-full bg-red-500" />
								</span>
								Happening Now
							</div>

							<div className="flex items-start gap-3 sm:gap-4">
								<svg className="w-7 h-7 sm:w-9 sm:h-9 shrink-0 mt-1" viewBox="0 0 24 24" fill="#FFC533" stroke="none">
									<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
								</svg>
								<h1 className="text-[32px] sm:text-[40px] lg:text-[52px] font-extrabold text-white tracking-tight leading-[1.05]">
									{sale.title}
								</h1>
							</div>

							{sale.description && (
								<p className="mt-3 text-[14px] sm:text-[15px] text-white/75 max-w-[520px] leading-relaxed">{sale.description}</p>
							)}

							<div className="mt-6">
								<p className="text-[11px] text-white/50 uppercase tracking-widest mb-2">Sale ends in</p>
								<FlashSaleCountdown endsAt={sale.ends_at} tone="dark" hideLabel />
							</div>
						</div>

						{/* Stats — translucent card so they read cleanly over the product photo */}
						<div className="flex items-center gap-6 sm:gap-8 rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-sm px-5 py-4 self-start lg:self-end shrink-0">
							<div className="text-center">
								<div className="text-[26px] sm:text-[30px] font-extrabold text-[#FFC533] leading-none">{items.length}</div>
								<div className="text-[10.5px] uppercase tracking-wider text-white/55 mt-1.5">Products</div>
							</div>
							<div className="w-px h-10 bg-white/15" />
							<div className="text-center">
								<div className="text-[26px] sm:text-[30px] font-extrabold text-[#FFC533] leading-none">
									{Math.max(...items.map((i) => Number(i.discount_value)))}
									{items.find((i) => i.discount_type === 'percentage') ? '%' : '₱'}
								</div>
								<div className="text-[10.5px] uppercase tracking-wider text-white/55 mt-1.5">Max Off</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* ── Products grid ── */}
			<div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-10 lg:py-12">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-[20px] font-bold text-gray-900">
						All Deals
						<span className="ml-2 text-[14px] font-normal text-gray-400">({items.length} items)</span>
					</h2>
				</div>

				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4">
					{items.map((item, i) => {
						const product = item.product;
						if (!product) return null;

						const discountVal = Number(item.discount_value)
						const discountPct = item.discount_type === 'percentage' ? discountVal : null;
						const soldPct = item.stock_limit
							? Math.min(100, Math.round((item.sold_count / item.stock_limit) * 100))
							: 0;
						const remaining = item.stock_limit !== null
							? Math.max(0, item.stock_limit - item.sold_count)
							: null;
						const bgColor = PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length];

						const variants = product.variants || [];
						const firstVariant = variants[0];
						const basePrice: number | null = firstVariant?.prices?.[0]?.amount ?? null;
						const salePrice =
							basePrice !== null
								? item.discount_type === 'percentage'
									? Math.round(basePrice * (1 - discountVal / 100))
									: Math.max(0, Math.round(basePrice - discountVal))
								: null;

						return (
							<Link
								key={item.id}
								href={`/products/${product.handle}`}
								className="group bg-white rounded-2xl border overflow-hidden block transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
								style={{ borderColor: '#EDEAE3', boxShadow: '0 1px 3px rgba(20,20,20,0.06)' }}
							>
								{/* Image */}
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

									{/* Discount badge */}
									{discountPct && (
										<span className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md leading-tight">
											-{discountPct}%
										</span>
									)}
									{item.discount_type === 'fixed' && (
										<span className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md leading-tight">
											-₱{discountVal.toLocaleString()}
										</span>
									)}

									{/* Sold out overlay */}
									{remaining !== null && remaining === 0 && (
										<div className="absolute inset-0 bg-black/50 flex items-center justify-center">
											<span className="bg-white text-gray-800 text-[11px] font-bold px-3 py-1 rounded-full">
												Sold Out
											</span>
										</div>
									)}

									{/* Wishlist */}
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
											<span className="text-[16px] font-extrabold text-[#1B1B1B]">View price</span>
										)}
									</div>

									{/* Stock progress — only when stock_limit is set */}
									{item.stock_limit !== null && item.stock_limit > 0 && (
										<>
											<div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,197,51,0.20)' }}>
												<div
													className="h-full rounded-full transition-all"
													style={{
														width: `${soldPct}%`,
														backgroundColor: soldPct >= 80 ? '#EF4444' : '#FFC533',
													}}
												/>
											</div>
											<div className="mt-1 text-[10.5px] text-[#737373] font-medium">
												{soldPct >= 80 ? (
													<span className="text-red-500 font-semibold">Almost gone!</span>
												) : (
													`${soldPct}% sold`
												)}
												{remaining !== null && ` · ${remaining} left`}
											</div>
										</>
									)}
								</div>
							</Link>
						);
					})}
				</div>

				{/* Bottom CTA */}
				<div className="mt-12 text-center py-8 border-t border-[#EDEAE3]">
					<p className="text-sm text-gray-500 mb-4">
						Want to see more deals? Browse our full catalog.
					</p>
					<Link
						href="/categories"
						className="inline-block px-6 py-3 rounded-full text-white font-semibold text-sm transition-opacity hover:opacity-90"
						style={{ backgroundColor: '#432C63' }}
					>
						Browse All Products
					</Link>
				</div>
			</div>
		</main>
	);
}
