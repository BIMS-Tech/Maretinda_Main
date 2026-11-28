import Image from 'next/image';
import Link from 'next/link';

import { Reveal, SectionHeading, Tilt } from '@/components/motion';
import { SELLER_REGISTER_URL } from '@/lib/helpers/cross-links';

// Same env vars and production fallbacks as the Footer.
const ABOUT_SITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://about.maretinda.com';

// Launch-stage value props instead of vanity scale metrics — honest for a new platform.
// These restate claims already made elsewhere on this section (the free month on
// Growth, no listing fees, nationwide reach), so no new/unverified metrics are introduced.
const STATS = [
	{ value: '1 month', label: 'Free on Growth' },
	{ value: '₱0', label: 'Listing fees' },
	{ value: 'PH-wide', label: 'Delivery reach' },
];

export const BecomeSellerBand = () => (
	<section style={{ backgroundColor: '#432C63' }}>
		<div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-14 lg:py-20">
			<div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
				{/* Left — copy + stats + CTAs */}
				<div className="flex-1 text-white">
					<SectionHeading
						className="max-w-[520px] font-serif text-[clamp(30px,3.5vw,42px)] leading-[1.05] tracking-[-0.01em]"
						eyebrow="Sell on Maretinda"
						eyebrowClassName="!mb-3 !text-white/70"
						text="Open your shop on Maretinda. Reach the whole Philippines."
					/>
					<p className="mt-4 text-[15px] text-white/80 max-w-[480px] leading-relaxed">
						From Luzon to Mindanao — list your products, manage orders, and grow your business with tools built for Filipino sellers.
					</p>

					{/* Stats row */}
					<Reveal className="mt-8 flex items-center gap-8 flex-wrap" variant="group">
						{STATS.map(({ value, label }) => (
							<div key={label}>
								<div className="text-[28px] font-extrabold leading-none" style={{ color: '#FFC533' }}>{value}</div>
								<div className="text-[12px] text-white/65 mt-0.5 font-medium">{label}</div>
							</div>
						))}
					</Reveal>

					{/* Divider */}
					<div className="mt-8 h-px w-full max-w-[480px]" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />

					{/* CTAs */}
					<div className="mt-7 flex items-center gap-3 flex-wrap">
						<Link
							href={SELLER_REGISTER_URL}
							className="press h-12 px-7 rounded-full text-[14px] font-bold flex items-center gap-2"
							style={{ backgroundColor: '#FFC533', color: '#432C63' }}
						>
							Start selling
							<svg aria-hidden="true" className="arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
								<path d="M5 12h14M13 5l7 7-7 7" />
							</svg>
						</Link>
						<Link
							href={`${ABOUT_SITE_URL}/#how-it-works`}
							className="h-12 px-7 rounded-full text-[14px] font-bold border border-white/40 text-white hover:border-white hover:bg-white/10 press flex items-center gap-2"
						>
							How it works
						</Link>
					</div>

					<div className="mt-5 text-[12px] text-white/55 font-medium">
						First month free on Growth · No listing fees · Cancel anytime
					</div>
				</div>

				{/* Right — real seller dashboard preview */}
				<Reveal className="flex-shrink-0 w-full lg:w-[560px]" variant="scale">
					<Tilt className="relative" max={5}>
						{/* Floating chip */}
						<div
							className="absolute -top-3.5 left-6 z-10 text-[11px] font-bold px-3 py-1 rounded-full shadow-md"
							style={{ backgroundColor: '#FFC533', color: '#432C63' }}
						>
							1 month · zero fees
						</div>

						<div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-white">
							<Image
								src="/vendor-dbrd.png"
								alt="Maretinda seller dashboard preview"
								width={3374}
								height={1610}
								className="w-full h-auto"
								sizes="(min-width: 1024px) 560px, 100vw"
								priority
							/>
						</div>
					</Tilt>
				</Reveal>
			</div>
		</div>
	</section>
);
