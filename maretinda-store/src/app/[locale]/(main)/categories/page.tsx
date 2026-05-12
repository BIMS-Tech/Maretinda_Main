import type { HttpTypes } from '@medusajs/types';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { ProductListingSkeleton } from '@/components/organisms/ProductListingSkeleton/ProductListingSkeleton';
import { AlgoliaProductsListing, ProductListing } from '@/components/sections';
import { categoryThemes } from '@/data/categories';
import { listCategories } from '@/lib/data/categories';
import { retrieveCustomer } from '@/lib/data/customer';
import { getRegion } from '@/lib/data/regions';
import { getUserWishlists } from '@/lib/data/wishlist';
import { sortCategories } from '@/lib/utils';
import type { Wishlist } from '@/types/wishlist';

const ALGOLIA_ID = process.env.NEXT_PUBLIC_ALGOLIA_ID;
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

const STRIPE = 'repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 14px)';

const CARD_PALETTES: Record<string, { bg: string; text: string }> = {
	sneakers:     { bg: '#F2D9E2', text: '#8B2252' },
	sandals:      { bg: '#FFF0D9', text: '#8B5E1A' },
	boots:        { bg: '#E8E0D8', text: '#4A3728' },
	sport:        { bg: '#D9EDE0', text: '#1F5C35' },
	tops:         { bg: '#D9E8F5', text: '#1A3F6F' },
	fashion:      { bg: '#F0E8F7', text: '#4A1F6F' },
	accessories:  { bg: '#F7E8F0', text: '#6F1F4A' },
	groceries:    { bg: '#E0F0D9', text: '#1F5020' },
	'food-items': { bg: '#FFF3D9', text: '#7A4500' },
	shopping:     { bg: '#D9EEF7', text: '#0A3D5C' },
};

const FALLBACK_PALETTES = [
	{ bg: '#E8DEF7', text: '#432C63' },
	{ bg: '#FFE2D2', text: '#8B3A1A' },
	{ bg: '#D9F0EA', text: '#1A5C48' },
	{ bg: '#F2E8D9', text: '#6B4226' },
	{ bg: '#D9E8F7', text: '#1A3F6F' },
	{ bg: '#F7D9E8', text: '#6F1F4A' },
];

function getPalette(handle: string, index: number) {
	return CARD_PALETTES[handle] ?? FALLBACK_PALETTES[index % FALLBACK_PALETTES.length];
}

export default async function AllCategories({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const user = await retrieveCustomer();

	let wishlist: Wishlist[] = [];
	if (user) {
		try {
			const response = await getUserWishlists();
			wishlist = response.wishlists;
		} catch {
			wishlist = [];
		}
	}

	const currency_code = (await getRegion(locale))?.currency_code || 'php';

	const { categories } = (await listCategories()) as {
		categories: HttpTypes.StoreProductCategory[];
		parentCategories: HttpTypes.StoreProductCategory[];
	};

	return (
		<main className="w-full">
			{/* ── Hero banner ── */}
			<div
				className="w-full py-12 lg:py-16 relative overflow-hidden"
				style={{ background: 'linear-gradient(135deg, #2A1B3E 0%, #432C63 60%, #6B3F8C 100%)' }}
			>
				<div className="absolute inset-0" style={{ backgroundImage: STRIPE }} />
				<div className="max-w-[1360px] mx-auto px-4 lg:px-6 relative">
					<div className="flex items-center gap-2 mb-3">
						<Link href="/" className="text-white/50 text-[13px] hover:text-white/80 transition-colors">Home</Link>
						<span className="text-white/30 text-[13px]">/</span>
						<span className="text-white/80 text-[13px]">All Categories</span>
					</div>
					<h1 className="text-[32px] lg:text-[48px] font-extrabold text-white tracking-tight leading-[1.05]">
						Shop by Category
					</h1>
					<p className="mt-3 text-[15px] text-white/70 max-w-[500px]">
						From fresh groceries to the latest fashion — discover everything from trusted Filipino sellers.
					</p>
					{/* Decorative pill count */}
					<div className="mt-6 flex flex-wrap gap-2">
						{categories.slice(0, 6).map((cat, i) => {
							const p = getPalette(cat.handle, i);
							return (
								<LocalizedClientLink
									key={cat.id}
									href={`/categories/${cat.handle}`}
									className="px-4 h-8 rounded-full text-[12px] font-semibold flex items-center hover:opacity-90 transition-opacity"
									style={{ backgroundColor: p.bg, color: p.text }}
								>
									{cat.name}
								</LocalizedClientLink>
							);
						})}
						{categories.length > 6 && (
							<span className="px-4 h-8 rounded-full text-[12px] font-semibold flex items-center bg-white/10 text-white">
								+{categories.length - 6} more
							</span>
						)}
					</div>
				</div>
			</div>

			<div className="max-w-[1360px] mx-auto px-4 lg:px-6">
				{/* ── Category cards grid ── */}
				<section className="py-10 lg:py-14">
					<div className="flex items-center justify-between mb-7">
						<h2 className="text-[22px] lg:text-[26px] font-extrabold text-[#1B1B1B] tracking-tight">
							All categories
						</h2>
						<span className="text-[13px] text-[#737373]">{categories.length} categories</span>
					</div>

					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4">
						{categories.map((category, index) => {
							const palette = getPalette(category.handle, index);
							const theme = categoryThemes[category.handle as keyof typeof categoryThemes];
							const imageUrl = (() => {
								const url = category.metadata?.image_url as string | undefined;
								return url && url.startsWith('http') ? url : null;
							})();

							return (
								<LocalizedClientLink
									key={category.id}
									href={`/categories/${category.handle}`}
									className="group relative rounded-2xl overflow-hidden border flex flex-col items-center justify-end transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
									style={{ borderColor: '#EDEAE3', backgroundColor: palette.bg, minHeight: '160px' }}
								>
									{/* Background image or placeholder */}
									<div className="absolute inset-0 flex items-center justify-center pt-4">
										{imageUrl ? (
											<Image
												src={imageUrl}
												alt={category.name}
												fill
												className="object-cover opacity-25 group-hover:opacity-35 transition-opacity"
												unoptimized
											/>
										) : (
											<div className="text-[52px] opacity-20 group-hover:opacity-30 transition-opacity select-none">
												{theme?.icon ?? '🛍️'}
											</div>
										)}
									</div>

									{/* Bottom label */}
									<div className="relative w-full px-3 pb-3 pt-10">
										<div
											className="absolute inset-0"
											style={{ background: `linear-gradient(to top, ${palette.bg} 50%, transparent 100%)` }}
										/>
										<div className="relative">
											<div className="text-[13.5px] font-extrabold leading-tight" style={{ color: palette.text }}>
												{category.name}
											</div>
											{category.category_children?.length > 0 && (
												<div className="text-[11px] mt-0.5 font-medium opacity-70" style={{ color: palette.text }}>
													{category.category_children.length} sub-categories
												</div>
											)}
										</div>
									</div>

									{/* Hover arrow */}
									<div
										className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
										style={{ backgroundColor: palette.text }}
									>
										<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
											<path d="M5 12h14M13 5l7 7-7 7" />
										</svg>
									</div>
								</LocalizedClientLink>
							);
						})}
					</div>
				</section>

				{/* ── Sub-categories by main category ── */}
				<section className="pb-12 space-y-6">
					<h2 className="text-[22px] lg:text-[26px] font-extrabold text-[#1B1B1B] tracking-tight mb-7">
						Browse sub-categories
					</h2>

					{categories
						.filter((cat) => cat.category_children?.length > 0)
						.map((category, index) => {
							const palette = getPalette(category.handle, index);
							const theme = categoryThemes[category.handle as keyof typeof categoryThemes];

							return (
								<div
									key={category.id}
									className="rounded-2xl border overflow-hidden"
									style={{ borderColor: '#EDEAE3' }}
								>
									{/* Category header */}
									<LocalizedClientLink
										href={`/categories/${category.handle}`}
										className="flex items-center justify-between px-5 py-4 group"
										style={{ backgroundColor: palette.bg }}
									>
										<div className="flex items-center gap-3">
											<div
												className="w-10 h-10 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0"
												style={{ backgroundColor: `${palette.text}15` }}
											>
												{theme?.icon ?? '🛍️'}
											</div>
											<div>
												<div className="text-[15px] font-extrabold" style={{ color: palette.text }}>
													{category.name}
												</div>
												{category.description && (
													<div className="text-[12px] opacity-70 mt-0.5 max-w-[400px] truncate" style={{ color: palette.text }}>
														{category.description}
													</div>
												)}
											</div>
										</div>
										<span
											className="text-[12px] font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
											style={{ color: palette.text }}
										>
											View all
											<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
												<path d="M5 12h14M13 5l7 7-7 7" />
											</svg>
										</span>
									</LocalizedClientLink>

									{/* Sub-category chips */}
									<div className="px-5 py-4 bg-white flex flex-wrap gap-2">
										{category.category_children
											.sort(sortCategories)
											.map((sub) => (
												<LocalizedClientLink
													key={sub.handle}
													href={`/categories/${category.handle}/${sub.handle}`}
													className="px-3.5 h-9 rounded-full border text-[12.5px] font-semibold transition-all hover:border-[#432C63] hover:text-[#432C63] flex items-center"
													style={{ borderColor: '#EDEAE3', color: '#404040' }}
												>
													{sub.name}
												</LocalizedClientLink>
											))}
									</div>
								</div>
							);
						})}
				</section>

				{/* ── All Products ── */}
				<section className="pb-16">
					<div
						className="rounded-2xl px-6 py-5 mb-8 flex items-center justify-between"
						style={{ background: 'linear-gradient(135deg, #2A1B3E 0%, #432C63 100%)' }}
					>
						<div>
							<div className="text-[12px] font-semibold tracking-[0.18em] uppercase text-white/60 mb-1">Everything</div>
							<h2 className="text-[22px] font-extrabold text-white tracking-tight">Browse all products</h2>
						</div>
						<div
							className="hidden sm:flex items-center gap-2 text-[13px] font-bold text-white/80"
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
							</svg>
							Filter & sort below
						</div>
					</div>

					<Suspense fallback={<ProductListingSkeleton />}>
						{!ALGOLIA_ID || !ALGOLIA_SEARCH_KEY ? (
							<ProductListing locale={locale} showSidebar />
						) : (
							<AlgoliaProductsListing
								currency_code={currency_code}
								locale={locale}
								user={user}
								wishlist={wishlist}
							/>
						)}
					</Suspense>
				</section>
			</div>
		</main>
	);
}
