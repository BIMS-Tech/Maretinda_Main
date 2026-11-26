import Link from 'next/link';
import type { CSSProperties } from 'react';

import { Marquee, MaskedText, Reveal, Tilt } from '@/components/motion';
import { FlashSaleCountdown } from '@/components/sections/FlashSaleSection/FlashSaleCountdown';
import type { HeroContent } from '@/lib/data/hero';

import { HeroPicture } from './HeroPicture';

type HeroProps = {
	buttons: { label: string; path: string }[];
	heading?: string;
	paragraph?: string;
	heroContent?: HeroContent | null;
};

const FALLBACK = {
	heading: 'Shop the Philippines. All in one place.',
	subheading:
		'From fresh palengke produce to fashion-forward finds — discover thousands of trusted local sellers, with fast nationwide delivery and cash on delivery available.',
	badge: 'New season · Pampanga local',
	featured_product_name: 'Filipiniana Sundress',
	featured_product_category: 'Fashion · Summer Drop',
	featured_product_price: 89900,
	featured_product_original_price: 129900,
	featured_product_link: '/categories',
	featured_product_image: '/images/featured-products/fashion.png',
	sellers_count: '12,800+',
	welcome_code: 'HELLOMRTD',
	welcome_label: '₱200 off',
	welcome_min_order: '₱1,500',
	festival_name: 'Sari-Sari Festival',
	festival_discount: 'Up to 70% off\nlocal brands',
	festival_link: '/categories',
};

function formatPrice(centavos: number) {
	return `₱${(centavos / 100).toLocaleString('en-PH', { maximumFractionDigits: 0 })}`
}

function calcDiscount(price: number, original: number) {
	return Math.round((1 - price / original) * 100)
}

const after = (ms: number) => ({ '--delay': `${ms}ms` }) as CSSProperties;

export const Hero = ({ buttons, heroContent }: HeroProps) => {
	const shopBtn = buttons.find((b) => b.label === 'Start Shopping') ?? buttons[0];
	const sellerBtn = buttons.find((b) => b.label === 'Become a Seller') ?? buttons[1];

	const s = heroContent?.site_settings ?? {}
	const wp = heroContent?.welcome_promo ?? null
	const fc = heroContent?.featured_campaign ?? null
	const liveSellersCount = heroContent?.sellers_count ?? null

	// Hero main card values
	const heading = s.heading || FALLBACK.heading
	const subheading = s.subheading || FALLBACK.subheading
	const badge = s.badge || FALLBACK.badge
	const productName = s.featured_product_name || FALLBACK.featured_product_name
	const productCategory = s.featured_product_category || FALLBACK.featured_product_category
	// Use FALLBACK prices only when there are no site_settings at all (API down / first deploy).
	// When a real product is configured, we get featured_product_price from the backend; original
	// price is omitted because Medusa's raw price API has no "compare-at" concept without a region
	// context — so we never bleed the FALLBACK original onto a live product.
	const hasLivePrice = s.featured_product_price != null
	const productPrice = s.featured_product_price ?? FALLBACK.featured_product_price
	const productOriginal: number | null = s.featured_product_original_price ?? (hasLivePrice ? null : FALLBACK.featured_product_original_price)
	// Counted from real reviews and orders by the backend
	const productRatings = Number(s.featured_product_rating_count ?? 0)
	const productRating = Number(s.featured_product_rating ?? 0)
	const soldThisWeek = Number(s.featured_product_sold_this_week ?? 0)
	const productLink = s.featured_product_link || FALLBACK.featured_product_link
	const productImage = s.featured_product_image || FALLBACK.featured_product_image
	// Live count from DB takes priority; admin override next; then fallback
	const sellersCount = liveSellersCount || s.sellers_count || FALLBACK.sellers_count

	// Welcome promo card values
	const welcomeCode = wp?.code || FALLBACK.welcome_code
	const welcomeLabel = wp?.discount_label || FALLBACK.welcome_label
	const welcomeMinOrder = wp?.min_order ? `₱${wp.min_order.toLocaleString('en-PH')}` : FALLBACK.welcome_min_order

	// Featured campaign card values
	const festivalName = fc?.name || FALLBACK.festival_name
	const festivalDiscount = fc?.discount_label || FALLBACK.festival_discount
	const festivalLink = fc?.shop_link || FALLBACK.festival_link
	const festivalEndsAt = fc?.ends_at || null

	return (
		<section
			style={{
				background: 'radial-gradient(1100px 500px at 8% 10%, rgba(255,197,51,0.18), transparent 60%), radial-gradient(800px 500px at 95% 90%, rgba(155,128,210,0.25), transparent 60%), linear-gradient(180deg, #372248 0%, #432C63 100%)',
			}}
		>
			{/* Hero cards grid */}
			<div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-8 grid grid-cols-12 gap-4 lg:gap-5">

				{/* Main hero card */}
				<div className="col-span-12 lg:col-span-8 relative rounded-2xl overflow-hidden lg:min-h-[420px] flex flex-col lg:flex-row" style={{ backgroundColor: '#FBF9FC' }}>
					{/* Striped background */}
					<div
						className="absolute inset-0"
						style={{
							backgroundColor: '#E6D4B7',
							backgroundImage: 'repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 14px)',
						}}
					/>
					{/* Fade overlay — desktop overlay effect only */}
					<div className="absolute inset-0 hidden lg:block" style={{ background: 'linear-gradient(to right, #FBF9FC 0%, rgba(251,249,252,0.88) 55%, transparent 100%)' }} />

					{/* Copy */}
					<div className="relative z-10 p-6 sm:p-8 lg:p-12 w-full max-w-full lg:max-w-[58%] flex flex-col justify-between bg-[#FBF9FC] lg:bg-transparent">
						<div>
							<div className="rise-in flex items-center gap-2 text-[12px] font-semibold tracking-[0.16em] uppercase" style={{ color: '#432C63' }}>
								<span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FFC533' }} />
								{badge}
							</div>
							<h1 className="mt-5 font-serif leading-[1] tracking-[-0.02em] text-[#1a1a1a]" style={{ fontSize: 'clamp(36px, 4.5vw, 60px)' }}>
								{heading.split('. ').map((line, i, lines) => (
									<span className={i === lines.length - 1 ? 'text-[#432C63]' : undefined} key={line}>
										<MaskedText delay={120 + i * 260} play text={i === lines.length - 1 ? line : `${line}.`} />
										{i < lines.length - 1 && <> <br /></>}
									</span>
								))}
							</h1>
							<p className="rise-in mt-4 text-[14px] sm:text-[15px] text-[#404040] leading-relaxed max-w-[420px]" style={after(620)}>
								{subheading}
							</p>
						</div>

						<div className="rise-in flex flex-wrap items-center gap-3 mt-6 lg:mt-8" style={after(740)}>
							{shopBtn && (
								<Link
									href={shopBtn.path}
									className="press inline-flex items-center gap-2 font-bold text-[14px] px-6 h-12 rounded-full"
									style={{ backgroundColor: '#FFC533', color: '#432C63' }}
								>
									{shopBtn.label}
									<svg aria-hidden="true" className="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
								</Link>
							)}
							{sellerBtn && (
								<Link
									href={sellerBtn.path}
									className="inline-flex items-center font-semibold text-[14px] px-6 h-12 rounded-full border border-black/15 text-[#1a1a1a] hover:bg-white/60 press"
									style={{ backgroundColor: 'rgba(255,255,255,0)' }}
								>
									{sellerBtn.label}
								</Link>
							)}
							<div className="hidden md:flex items-center gap-2 ml-2 text-[12px] text-[#404040]">
								<div className="flex -space-x-2">
									<div className="pop-in w-7 h-7 rounded-full border-2 border-[#FBF9FC]" style={{ ...after(880), backgroundColor: '#E26D5C' }} />
									<div className="pop-in w-7 h-7 rounded-full border-2 border-[#FBF9FC]" style={{ ...after(960), backgroundColor: '#5FA88B' }} />
									<div className="pop-in w-7 h-7 rounded-full border-2 border-[#FBF9FC]" style={{ ...after(1040), backgroundColor: '#7FA8C9' }} />
									<div className="pop-in w-7 h-7 rounded-full border-2 border-[#FBF9FC]" style={{ ...after(1120), backgroundColor: '#D98AA1' }} />
								</div>
								<span><b className="text-[#1a1a1a]">{sellersCount}</b> sellers</span>
							</div>
						</div>
					</div>

					{/* Featured product panel — stacked below copy on mobile, overlaid on the right on desktop */}
					<div className="relative w-full h-56 sm:h-64 mt-auto lg:mt-0 lg:absolute lg:right-0 lg:top-0 lg:bottom-0 lg:h-auto lg:w-[44%]">
						<Tilt className="h-full w-full" lift={12} max={4}>
							<div className="relative h-full w-full scale-[1.04]">
								<HeroPicture alt={`${productName} — featured pick`} fallback={FALLBACK.featured_product_image} src={productImage} />
							</div>
						</Tilt>

						{soldThisWeek > 0 && (
							<div className="pop-in absolute top-5 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm" style={after(900)}>
								<span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse motion-reduce:animate-none" />
								<span className="text-[11px] font-semibold text-[#1a1a1a]">{soldThisWeek.toLocaleString('en-PH')} sold this week</span>
							</div>
						)}

						{/* FEATURED badge */}
						<div className="pop-in absolute top-4 right-4 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ ...after(980), backgroundColor: '#FFC533', color: '#432C63' }}>
							Featured
						</div>

						{/* Product info card */}
						<div className="rise-in absolute bottom-5 left-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-md" style={after(820)}>
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<div className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: '#432C63' }}>{productCategory}</div>
									<div className="text-[13px] font-bold text-[#1a1a1a] mt-0.5 truncate">{productName}</div>
									<div className="flex items-center gap-2 mt-1.5">
										<span className="text-[15px] font-bold" style={{ color: '#432C63' }}>{formatPrice(productPrice)}</span>
										{productOriginal != null && productOriginal > productPrice && (
											<>
												<span className="text-[12px] text-[#aaa] line-through">{formatPrice(productOriginal)}</span>
												<span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: '#D94040' }}>−{calcDiscount(productPrice, productOriginal)}%</span>
											</>
										)}
									</div>
									{productRatings > 0 && productRating > 0 && (
										<div className="flex items-center gap-1 mt-1">
											{[1,2,3,4,5].map((star) => (
												<svg aria-hidden="true" key={star} width="10" height="10" viewBox="0 0 24 24" fill={star <= Math.round(productRating) ? '#FFC533' : '#E3DDEA'} stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
											))}
											<span className="text-[11px] text-[#888] ml-1">({productRatings.toLocaleString('en-PH')})</span>
										</div>
									)}
								</div>
								<Link
									aria-label={`Shop ${productName}`}
									href={productLink}
									className="press shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white mt-1"
									style={{ backgroundColor: '#432C63' }}
								>
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
								</Link>
							</div>
						</div>
					</div>

				</div>

				{/* Promo sidebar */}
				<div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:gap-5">
					{/* Welcome offer — yellow card */}
					<div className="rise-in group relative flex min-h-[190px] flex-1 flex-col justify-between overflow-hidden rounded-2xl p-6" style={{ ...after(260), backgroundColor: '#FFC533', color: '#432C63' }}>
						<div>
							<div className="text-[11px] font-bold tracking-[0.16em] uppercase opacity-70">Welcome offer</div>
							<div className="mt-2 font-serif leading-[1] tracking-[-0.01em]" style={{ fontSize: '40px' }}>{welcomeLabel}</div>
							<div className="mt-1 text-[13px] font-medium opacity-85">first order over {welcomeMinOrder}</div>
						</div>
						<div className="flex items-center justify-between">
							<code className="font-mono text-[12px] font-bold px-2.5 py-1 rounded-md tracking-wider" style={{ backgroundColor: '#432C63', color: '#FFC533' }}>{welcomeCode}</code>
							<Link href="/vouchers" className="press text-[13px] font-bold inline-flex items-center gap-1.5"><span className="link-line">Claim</span> <span aria-hidden="true" className="arrow inline-block">→</span></Link>
						</div>
						<div className="absolute -right-8 -top-8 w-32 h-32 rounded-full border-2 border-[#432C63]/20 transition-transform duration-1000 ease-soft group-hover:scale-125" />
					</div>

					{/* Featured campaign card */}
					<div className="rise-in group relative flex min-h-[190px] flex-1 flex-col justify-between overflow-hidden rounded-2xl p-6 text-white" style={{ ...after(380), backgroundColor: '#372248' }}>
						<div
							className="absolute inset-0 opacity-30"
							style={{
								backgroundColor: '#5A3F7E',
								backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 14px)',
							}}
						/>
						<div className="relative">
							{fc?.badge_label && (
								<div className="text-[11px] font-bold tracking-[0.16em] uppercase" style={{ color: '#FFC533' }}>{fc.badge_label}</div>
							)}
							{!fc?.badge_label && (
								<div className="text-[11px] font-bold tracking-[0.16em] uppercase" style={{ color: '#FFC533' }}>{festivalName}</div>
							)}
							<div className="mt-2 font-serif leading-[1.05] tracking-[-0.01em]" style={{ fontSize: '28px' }}>
								{festivalDiscount.split('\n').map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
							</div>
						</div>
						<div className="relative flex items-center justify-between">
							{festivalEndsAt ? <FlashSaleCountdown endsAt={festivalEndsAt} tone="dark" /> : <span />}
							<Link
								href={festivalLink}
								className="press text-[12px] font-bold px-3.5 py-1.5 rounded-full bg-white"
								style={{ color: '#432C63' }}
							>
								Shop now
							</Link>
						</div>
					</div>
				</div>
			</div>

			{/* Service strip */}
			<div style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
				<Reveal className="max-w-[1360px] mx-auto px-4 lg:px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-white" variant="group">
					{[
						{
							icon: <><path d="M3 7h13v10H3zM16 10h4l1 2v5h-5" /><circle cx="7" cy="17" r="2" /><circle cx="18" cy="17" r="2" /></>,
							label: 'Free shipping', sub: 'on orders over ₱499',
						},
						{
							icon: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></>,
							label: 'Cash on delivery', sub: 'pay when you receive',
						},
						{
							icon: <><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" /></>,
							label: '7-day returns', sub: 'hassle-free refunds',
						},
						{
							icon: <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5A8.5 8.5 0 0 1 21 11v.5z" />,
							label: '24/7 support', sub: 'English & Tagalog',
						},
					].map(({ icon, label, sub }) => (
						<div key={label} className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">{icon}</svg>
							</div>
							<div>
								<div className="text-[13.5px] font-bold">{label}</div>
								<div className="text-[11.5px] text-white/65">{sub}</div>
							</div>
						</div>
					))}
				</Reveal>
			</div>

			{/* What the marketplace stands for, drifting by */}
			<div className="border-y border-[#EDE8F2] bg-white py-5">
				<Marquee
					className="font-serif text-[26px] tracking-[-0.01em] text-[#1B1B1B] lg:text-[34px]"
					items={['Cash on delivery', 'Trusted local sellers', 'Free shipping from ₱499', 'Made in the Philippines', '7-day returns', 'Delivered nationwide']}
				/>
			</div>
		</section>
	);
};
