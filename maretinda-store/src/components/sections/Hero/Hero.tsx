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
				background: 'radial-gradient(1100px 500px at 8% 10%, rgba(255,255,255,0.06), transparent 60%), radial-gradient(800px 500px at 95% 90%, rgba(155,128,210,0.25), transparent 60%), linear-gradient(180deg, #2A1B3E 0%, #432C63 100%)',
			}}
		>
			{/* Hero cards grid */}
			<div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-8 grid grid-cols-12 gap-4 lg:gap-5">

				{/* Main hero card */}
				<div className="col-span-12 lg:col-span-8 relative rounded-2xl overflow-hidden min-h-[380px] lg:min-h-[420px] flex" style={{ backgroundColor: '#FAF8F5' }}>
					{/* Striped background */}
					<div
						className="absolute inset-0"
						style={{
							backgroundColor: '#E6D4B7',
							backgroundImage: 'repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 14px)',
						}}
					/>
					{/* Fade overlay */}
					<div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #FAF8F5 0%, rgba(250,248,245,0.88) 55%, transparent 100%)' }} />

					{/* Copy */}
					<div className="relative z-10 p-8 lg:p-12 max-w-[58%] flex flex-col justify-between">
						<div>
							<div className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.16em] uppercase" style={{ color: '#432C63' }}>
								<span className="w-2 h-2 rounded-full bg-[#1B1B1B]" />
								New season · Pampanga local
							</div>
							<h1 className="mt-5 font-extrabold leading-[1.02] tracking-tight text-[#1B1B1B]" style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}>
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
									className="inline-flex items-center gap-2 font-bold text-[14px] px-6 h-12 rounded-full text-white transition-colors hover:opacity-90"
									style={{ backgroundColor: '#1B1B1B' }}
								>
									{shopBtn.label}
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
								</Link>
							)}
							{sellerBtn && (
								<Link
									href={sellerBtn.path}
									className="inline-flex items-center font-semibold text-[14px] px-6 h-12 rounded-full border border-black/15 text-[#1B1B1B] hover:bg-white/60 transition-colors"
									style={{ backgroundColor: 'rgba(255,255,255,0)' }}
								>
									{sellerBtn.label}
								</Link>
							)}
							<div className="hidden md:flex items-center gap-2 ml-2 text-[12px] text-[#404040]">
								<div className="flex -space-x-2">
									<div className="w-7 h-7 rounded-full border-2 border-[#FAF8F5]" style={{ backgroundColor: '#E26D5C' }} />
									<div className="w-7 h-7 rounded-full border-2 border-[#FAF8F5]" style={{ backgroundColor: '#5FA88B' }} />
									<div className="w-7 h-7 rounded-full border-2 border-[#FAF8F5]" style={{ backgroundColor: '#7FA8C9' }} />
									<div className="w-7 h-7 rounded-full border-2 border-[#FAF8F5]" style={{ backgroundColor: '#D98AA1' }} />
								</div>
								<span><b className="text-[#1B1B1B]">12,800+</b> vendors</span>
							</div>
						</div>
					</div>

					{/* Right placeholder slot */}
					<div className="hidden lg:flex absolute right-0 top-0 bottom-0 w-[44%] items-end justify-end p-6">
						<div
							className="relative w-full h-full rounded-xl overflow-hidden"
							style={{
								backgroundColor: '#D9C4A0',
								backgroundImage: 'repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 14px)',
							}}
						>
							<div className="absolute inset-0 flex items-end p-5">
								<div className="bg-white/95 rounded-lg px-3.5 py-2.5 shadow-sm flex items-center gap-3">
									<div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(67,44,99,0.10)' }}>
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#432C63" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
									</div>
									<div>
										<div className="text-[11px] text-[#737373] uppercase tracking-wider font-mono">Hero asset slot</div>
										<div className="text-[12px] font-semibold text-[#1B1B1B]">1100 × 800 — product image</div>
									</div>
								</div>
							</div>
							<div className="absolute top-4 right-4 bg-[#1B1B1B] text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
								Featured
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
					{/* Welcome offer — ink card */}
					<div className="relative rounded-2xl overflow-hidden text-white p-6 min-h-[190px] flex flex-col justify-between" style={{ backgroundColor: '#1B1B1B' }}>
						<div>
							<div className="text-[11px] font-bold tracking-[0.16em] uppercase opacity-70">Welcome offer</div>
							<div className="mt-2 text-[34px] font-extrabold leading-[1] tracking-tight">₱200 off</div>
							<div className="mt-1 text-[13px] font-medium opacity-85">first order over ₱1,500</div>
						</div>
						<div className="flex items-center justify-between">
							<code className="font-mono text-[12px] font-bold bg-white text-[#1B1B1B] px-2.5 py-1 rounded-md tracking-wider">HELLOMRTD</code>
							<Link href="/categories" className="text-[13px] font-bold underline underline-offset-4 text-white hover:opacity-80">Claim →</Link>
						</div>
						<div className="absolute -right-8 -top-8 w-32 h-32 rounded-full border-2 border-white/15" />
					</div>

					{/* Sari-Sari festival card */}
					<div className="relative rounded-2xl overflow-hidden text-white p-6 min-h-[190px] flex flex-col justify-between" style={{ backgroundColor: '#2A1B3E' }}>
						<div
							className="absolute inset-0 opacity-30"
							style={{
								backgroundColor: '#5A3F7E',
								backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 14px)',
							}}
						/>
						<div className="relative">
							<div className="text-[11px] font-bold tracking-[0.16em] uppercase text-white/70">Sari-Sari Festival</div>
							<div className="mt-2 text-[24px] font-extrabold leading-[1.05] tracking-tight">
								Up to 70% off<br />local brands
							</div>
						</div>
						<div className="relative flex items-center justify-between">
							<div className="text-[12px] opacity-80">Ends in 2d 14h 22m</div>
							<Link
								href="/categories"
								className="text-[12px] font-bold px-3.5 py-1.5 rounded-full text-[#432C63] bg-white hover:bg-white/90 transition-colors"
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
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
								<path d="M3 7h13v10H3zM16 10h4l1 2v5h-5" /><circle cx="7" cy="17" r="2" /><circle cx="18" cy="17" r="2" />
							</svg>
						</div>
						<div>
							<div className="text-[13.5px] font-bold">Free shipping</div>
							<div className="text-[11.5px] text-white/65">on orders over ₱499</div>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
								<rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" />
							</svg>
						</div>
						<div>
							<div className="text-[13.5px] font-bold">Cash on delivery</div>
							<div className="text-[11.5px] text-white/65">pay when you receive</div>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
								<path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" />
							</svg>
						</div>
						<div>
							<div className="text-[13.5px] font-bold">7-day returns</div>
							<div className="text-[11.5px] text-white/65">hassle-free refunds</div>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
								<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5A8.5 8.5 0 0 1 21 11v.5z" />
							</svg>
						</div>
						<div>
							<div className="text-[13.5px] font-bold">24/7 support</div>
							<div className="text-[11.5px] text-white/65">English & Tagalog</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
