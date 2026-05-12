import Link from 'next/link';

const STRIPE = 'repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 14px)';

export const FeaturedCollectionsSection = () => (
	<section className="bg-white">
		<div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-12 lg:py-16">
			{/* Header */}
			<div className="flex items-end justify-between mb-7 lg:mb-8">
				<div>
					<div className="text-[12px] font-semibold tracking-[0.18em] uppercase" style={{ color: '#432C63' }}>
						Curated for you
					</div>
					<h2 className="mt-2 text-[26px] lg:text-[32px] font-extrabold tracking-tight text-[#1B1B1B]">
						Featured collections
					</h2>
				</div>
				<Link href="/collections" className="text-[13px] font-bold flex items-center gap-1.5 hover:underline" style={{ color: '#432C63' }}>
					View all collections →
				</Link>
			</div>

			<div className="grid grid-cols-12 gap-4 lg:gap-5">
				{/* Large featured card */}
				<Link
					href="/collections"
					className="col-span-12 lg:col-span-6 relative rounded-2xl overflow-hidden border h-[420px] block group"
					style={{ borderColor: '#EDEAE3', backgroundColor: '#FAF8F5' }}
				>
					<div className="absolute inset-0" style={{ backgroundColor: '#B8A6D6', backgroundImage: STRIPE }} />
					<div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #2A1B3E 0%, rgba(42,27,62,0.30) 45%, transparent 100%)' }} />
					<div className="absolute top-5 left-5 bg-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ color: '#432C63' }}>New</div>
					<div className="absolute bottom-0 left-0 right-0 p-7 text-white">
						<div className="text-[11.5px] font-bold tracking-[0.16em] uppercase opacity-80">Editor&apos;s pick</div>
						<h3 className="mt-2 text-[30px] lg:text-[34px] font-extrabold leading-[1.05] tracking-tight max-w-[420px]">
							New Filipino brands to know
						</h3>
						<p className="mt-3 text-[14px] text-white/85 max-w-[440px]">
							42 emerging local makers — from Cordillera weavers to Cebu ceramicists. Hand-picked by our editorial team.
						</p>
						<div className="mt-5 inline-flex items-center gap-2 bg-white text-[#1B1B1B] px-5 h-11 rounded-full text-[13.5px] font-bold">
							Explore collection
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
						</div>
					</div>
				</Link>

				{/* Right column: two stacked medium cards */}
				<div className="col-span-12 lg:col-span-6 grid grid-cols-2 grid-rows-2 gap-4 lg:gap-5">
					<Link href="/collections/beauty" className="col-span-2 lg:col-span-1 relative rounded-2xl overflow-hidden border h-[200px] block group" style={{ borderColor: '#EDEAE3', backgroundColor: '#FAF8F5' }}>
						<div className="absolute inset-0" style={{ backgroundColor: '#D9CFB8', backgroundImage: STRIPE }} />
						<div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #FAF8F5 0%, rgba(250,248,245,0.70) 50%, transparent 100%)' }} />
						<div className="absolute inset-0 p-6 flex flex-col justify-between">
							<div className="text-[11px] font-bold tracking-[0.16em] uppercase opacity-70" style={{ color: '#432C63' }}>Beauty</div>
							<div>
								<h3 className="text-[22px] font-extrabold leading-[1.1] tracking-tight max-w-[180px] text-[#1B1B1B]">K-beauty essentials</h3>
								<span className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-bold" style={{ color: '#432C63' }}>Shop now →</span>
							</div>
						</div>
					</Link>

					<Link href="/collections/home" className="col-span-2 lg:col-span-1 relative rounded-2xl overflow-hidden border h-[200px] block group" style={{ borderColor: '#EDEAE3', backgroundColor: '#FAF8F5' }}>
						<div className="absolute inset-0" style={{ backgroundColor: '#C8E2D0', backgroundImage: STRIPE }} />
						<div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #FAF8F5 0%, rgba(250,248,245,0.70) 50%, transparent 100%)' }} />
						<div className="absolute inset-0 p-6 flex flex-col justify-between">
							<div className="text-[11px] font-bold tracking-[0.16em] uppercase opacity-70" style={{ color: '#432C63' }}>Home</div>
							<div>
								<h3 className="text-[22px] font-extrabold leading-[1.1] tracking-tight max-w-[180px] text-[#1B1B1B]">Home refresh under ₱500</h3>
								<span className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-bold" style={{ color: '#432C63' }}>Shop now →</span>
							</div>
						</div>
					</Link>

					{/* Bottom four small cards */}
					{[
						{ bg: '#E2D9F3', label: 'Fashion', title: 'Summer linens', sub: 'from ₱399', href: '/categories/fashion' },
						{ bg: '#F2D9DB', label: 'Food', title: 'Pinoy pantry', sub: '86 staples · free ship', href: '/categories/food-beverage' },
						{ bg: '#D9E5F0', label: 'Tech', title: 'Back-to-school tech', sub: 'laptops · tablets · audio', href: '/categories/electronics' },
						{ bg: '#F0E4CC', label: 'Wellness', title: 'Clean beauty', sub: 'organic & cruelty-free', href: '/categories/health' },
					].map(({ bg, label, title, sub, href }) => (
						<Link
							key={title}
							href={href}
							className="relative rounded-2xl overflow-hidden border h-[180px] lg:h-[200px] block group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
							style={{ borderColor: '#EDEAE3', backgroundColor: '#FAF8F5' }}
						>
							<div className="absolute inset-0" style={{ backgroundColor: bg, backgroundImage: STRIPE }} />
							<div className="absolute inset-0 p-5 flex flex-col justify-between">
								<div className="text-[11px] font-bold tracking-[0.16em] uppercase opacity-70" style={{ color: '#432C63' }}>{label}</div>
								<div>
									<h3 className="text-[17px] font-extrabold leading-tight text-[#1B1B1B]">{title}</h3>
									<div className="text-[12px] mt-0.5" style={{ color: '#404040' }}>{sub}</div>
								</div>
							</div>
						</Link>
					))}
				</div>
			</div>
		</div>
	</section>
);
