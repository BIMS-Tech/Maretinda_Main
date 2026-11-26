import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AnimatedNumber, MaskedText } from '@/components/motion';
import { FlashSaleGrid } from '@/components/organisms/FlashSaleGrid/FlashSaleGrid';
import { getActiveFlashSale } from '@/lib/data/flash-sales';
import { FlashSaleCountdown } from '@/components/sections/FlashSaleSection/FlashSaleCountdown';

export const metadata: Metadata = {
	title: 'Flash Sale — Maretinda',
	description: 'Limited-time deals with massive discounts. Shop now before the sale ends!',
};

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
	// Percentages and peso amounts can't be compared, so the biggest percentage speaks for the sale when there is one
	const most = (type: 'percentage' | 'fixed') => Math.max(0, ...items.filter((i) => i.discount_type === type).map((i) => Number(i.discount_value)));
	const mostOff = most('percentage') ? `${most('percentage')}%` : `₱${most('fixed').toLocaleString('en-PH')}`;

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
									<MaskedText play text={sale.title} />
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
								<div className="text-[26px] sm:text-[30px] font-extrabold text-[#FFC533] leading-none"><AnimatedNumber fromZero value={items.length} /></div>
								<div className="text-[10.5px] uppercase tracking-wider text-white/55 mt-1.5">Products</div>
							</div>
							<div className="w-px h-10 bg-white/15" />
							<div className="text-center">
								<div className="text-[26px] sm:text-[30px] font-extrabold text-[#FFC533] leading-none">
									{mostOff}
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

				<FlashSaleGrid items={items} />
			</div>
		</main>
	);
}
