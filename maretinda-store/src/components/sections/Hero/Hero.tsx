import Image from 'next/image';
import Link from 'next/link';

type HeroProps = {
	buttons: { label: string; path: string }[];
	heading?: string;
	paragraph?: string;
};

export const Hero = ({ buttons }: HeroProps) => {
	const shopBtn = buttons.find((b) => b.label === 'Start Shopping') ?? buttons[0];
	const sellerBtn = buttons.find((b) => b.label === 'Become a Seller') ?? buttons[1];

	return (
		<section
			style={{
				background: 'radial-gradient(1100px 500px at 8% 10%, rgba(255,197,51,0.18), transparent 60%), radial-gradient(800px 500px at 95% 90%, rgba(155,128,210,0.25), transparent 60%), linear-gradient(180deg, #372248 0%, #432C63 100%)',
			}}
		>
			{/* Hero cards grid */}
			<div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-8 grid grid-cols-12 gap-4 lg:gap-5">

				{/* Main hero card */}
				<div className="col-span-12 lg:col-span-8 relative rounded-2xl overflow-hidden min-h-[380px] lg:min-h-[420px] flex" style={{ backgroundColor: '#FBF9FC' }}>
					{/* Striped background */}
					<div
						className="absolute inset-0"
						style={{
							backgroundColor: '#E6D4B7',
							backgroundImage: 'repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 14px)',
						}}
					/>
					{/* Fade overlay */}
					<div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #FBF9FC 0%, rgba(251,249,252,0.88) 55%, transparent 100%)' }} />

					{/* Copy */}
					<div className="relative z-10 p-8 lg:p-12 max-w-[58%] flex flex-col justify-between">
						<div>
							<div className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.16em] uppercase" style={{ color: '#432C63' }}>
								<span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FFC533' }} />
								New season · Pampanga local
							</div>
							<h1 className="mt-5 font-serif leading-[1] tracking-[-0.02em] text-[#1a1a1a]" style={{ fontSize: 'clamp(36px, 4.5vw, 60px)' }}>
								Shop the<br />
								Philippines.<br />
								<span style={{ color: '#432C63' }}>All in one place.</span>
							</h1>
							<p className="mt-4 text-[15px] text-[#404040] leading-relaxed max-w-[420px] hidden md:block">
								From fresh palengke produce to fashion-forward finds — discover thousands of trusted local vendors, with fast nationwide delivery and cash on delivery available.
							</p>
						</div>

						<div className="flex flex-wrap items-center gap-3 mt-6 lg:mt-8">
							{shopBtn && (
								<Link
									href={shopBtn.path}
									className="inline-flex items-center gap-2 font-bold text-[14px] px-6 h-12 rounded-full transition-opacity hover:opacity-90"
									style={{ backgroundColor: '#FFC533', color: '#432C63' }}
								>
									{shopBtn.label}
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
								</Link>
							)}
							{sellerBtn && (
								<Link
									href={sellerBtn.path}
									className="inline-flex items-center font-semibold text-[14px] px-6 h-12 rounded-full border border-black/15 text-[#1a1a1a] hover:bg-white/60 transition-colors"
									style={{ backgroundColor: 'rgba(255,255,255,0)' }}
								>
									{sellerBtn.label}
								</Link>
							)}
							<div className="hidden md:flex items-center gap-2 ml-2 text-[12px] text-[#404040]">
								<div className="flex -space-x-2">
									<div className="w-7 h-7 rounded-full border-2 border-[#FBF9FC]" style={{ backgroundColor: '#E26D5C' }} />
									<div className="w-7 h-7 rounded-full border-2 border-[#FBF9FC]" style={{ backgroundColor: '#5FA88B' }} />
									<div className="w-7 h-7 rounded-full border-2 border-[#FBF9FC]" style={{ backgroundColor: '#7FA8C9' }} />
									<div className="w-7 h-7 rounded-full border-2 border-[#FBF9FC]" style={{ backgroundColor: '#D98AA1' }} />
								</div>
								<span><b className="text-[#1a1a1a]">12,800+</b> vendors</span>
							</div>
						</div>
					</div>

					{/* Featured product panel */}
					<div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[44%]">
						{/* Product image */}
						<div className="relative w-full h-full">
							<Image
								src="/images/featured-products/fashion.png"
								alt="Filipiniana Sundress — featured fashion pick"
								fill
								className="object-contain object-bottom"
								sizes="25vw"
								priority
							/>
						</div>

						{/* Sold-today chip */}
						<div className="absolute top-5 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm">
							<span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
							<span className="text-[11px] font-semibold text-[#1a1a1a]">247 sold this week</span>
						</div>

						{/* FEATURED badge */}
						<div className="absolute top-4 right-4 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ backgroundColor: '#FFC533', color: '#432C63' }}>
							Featured
						</div>

						{/* Product info card */}
						<div className="absolute bottom-5 left-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-md">
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<div className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: '#432C63' }}>Fashion · Summer Drop</div>
									<div className="text-[13px] font-bold text-[#1a1a1a] mt-0.5 truncate">Filipiniana Sundress</div>
									<div className="flex items-center gap-2 mt-1.5">
										<span className="text-[15px] font-bold" style={{ color: '#432C63' }}>₱899</span>
										<span className="text-[12px] text-[#aaa] line-through">₱1,299</span>
										<span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: '#D94040' }}>−31%</span>
									</div>
									<div className="flex items-center gap-1 mt-1">
										{[1,2,3,4,5].map((s) => (
											<svg key={s} width="10" height="10" viewBox="0 0 24 24" fill="#FFC533" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
										))}
										<span className="text-[11px] text-[#888] ml-1">(248)</span>
									</div>
								</div>
								<Link
									href="/categories"
									className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white mt-1 transition-opacity hover:opacity-80"
									style={{ backgroundColor: '#432C63' }}
								>
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
								</Link>
							</div>
						</div>
					</div>

					{/* Slider dots */}
					<div className="absolute bottom-5 left-8 lg:left-12 flex items-center gap-1.5 z-10">
						<span className="w-7 h-1.5 rounded-full" style={{ backgroundColor: '#432C63' }} />
						<span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(67,44,99,0.25)' }} />
						<span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(67,44,99,0.25)' }} />
						<span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(67,44,99,0.25)' }} />
					</div>
				</div>

				{/* Promo sidebar */}
				<div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:gap-5">
					{/* Welcome offer — yellow card */}
					<div className="relative rounded-2xl overflow-hidden p-6 min-h-[190px] flex flex-col justify-between" style={{ backgroundColor: '#FFC533', color: '#432C63' }}>
						<div>
							<div className="text-[11px] font-bold tracking-[0.16em] uppercase opacity-70">Welcome offer</div>
							<div className="mt-2 font-serif leading-[1] tracking-[-0.01em]" style={{ fontSize: '40px' }}>₱200 off</div>
							<div className="mt-1 text-[13px] font-medium opacity-85">first order over ₱1,500</div>
						</div>
						<div className="flex items-center justify-between">
							<code className="font-mono text-[12px] font-bold px-2.5 py-1 rounded-md tracking-wider" style={{ backgroundColor: '#432C63', color: '#FFC533' }}>HELLOMRTD</code>
							<Link href="/vouchers" className="text-[13px] font-bold underline underline-offset-4 hover:opacity-80">Claim →</Link>
						</div>
						<div className="absolute -right-8 -top-8 w-32 h-32 rounded-full border-2 border-[#432C63]/20" />
					</div>

					{/* Sari-Sari festival card */}
					<div className="relative rounded-2xl overflow-hidden text-white p-6 min-h-[190px] flex flex-col justify-between" style={{ backgroundColor: '#372248' }}>
						<div
							className="absolute inset-0 opacity-30"
							style={{
								backgroundColor: '#5A3F7E',
								backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 14px)',
							}}
						/>
						<div className="relative">
							<div className="text-[11px] font-bold tracking-[0.16em] uppercase" style={{ color: '#FFC533' }}>Sari-Sari Festival</div>
							<div className="mt-2 font-serif leading-[1.05] tracking-[-0.01em]" style={{ fontSize: '28px' }}>
								Up to 70% off<br />local brands
							</div>
						</div>
						<div className="relative flex items-center justify-between">
							<div className="text-[12px] opacity-80">Ends in 2d 14h 22m</div>
							<Link
								href="/categories"
								className="text-[12px] font-bold px-3.5 py-1.5 rounded-full bg-white hover:bg-white/90 transition-colors"
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
				<div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-white">
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
				</div>
			</div>
		</section>
	);
};
