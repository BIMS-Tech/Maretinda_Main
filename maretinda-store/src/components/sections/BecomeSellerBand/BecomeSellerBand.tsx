import Link from 'next/link';

const STATS = [
	{ value: '12.8k', label: 'Active sellers' },
	{ value: '1.4M', label: 'Monthly shoppers' },
	{ value: '97%', label: 'On-time delivery' },
];

const ChartBar = ({ h, active }: { h: number; active?: boolean }) => (
	<div
		className="w-5 rounded-t-sm flex-shrink-0"
		style={{ height: `${h}px`, backgroundColor: active ? '#432C63' : '#E8DEF7' }}
	/>
);

export const BecomeSellerBand = () => (
	<section style={{ backgroundColor: '#432C63' }}>
		<div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-14 lg:py-20">
			<div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
				{/* Left — copy + stats + CTAs */}
				<div className="flex-1 text-white">
					<div className="text-[12px] font-semibold tracking-[0.18em] uppercase opacity-70 mb-3">
						Sell on Maretinda
					</div>
					<h2 className="font-serif leading-[1.05] tracking-[-0.01em] max-w-[520px]" style={{ fontSize: 'clamp(30px, 3.5vw, 42px)' }}>
						Open your shop on Maretinda. Reach the whole Philippines.
					</h2>
					<p className="mt-4 text-[15px] text-white/80 max-w-[480px] leading-relaxed">
						From Luzon to Mindanao — list your products, manage orders, and grow your business with tools built for Filipino sellers.
					</p>

					{/* Stats row */}
					<div className="mt-8 flex items-center gap-8 flex-wrap">
						{STATS.map(({ value, label }) => (
							<div key={label}>
								<div className="text-[28px] font-extrabold leading-none" style={{ color: '#FFC533' }}>{value}</div>
								<div className="text-[12px] text-white/65 mt-0.5 font-medium">{label}</div>
							</div>
						))}
					</div>

					{/* Divider */}
					<div className="mt-8 h-px w-full max-w-[480px]" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />

					{/* CTAs */}
					<div className="mt-7 flex items-center gap-3 flex-wrap">
						<Link
							href="/seller/register"
							className="h-12 px-7 rounded-full text-[14px] font-bold transition-opacity hover:opacity-90 flex items-center gap-2"
							style={{ backgroundColor: '#FFC533', color: '#432C63' }}
						>
							Start selling
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
								<path d="M5 12h14M13 5l7 7-7 7" />
							</svg>
						</Link>
						<Link
							href="/seller/how-it-works"
							className="h-12 px-7 rounded-full text-[14px] font-bold border border-white/40 text-white hover:border-white hover:bg-white/10 transition-colors flex items-center gap-2"
						>
							How it works
						</Link>
					</div>

					<div className="mt-5 text-[12px] text-white/55 font-medium">
						90 days free · No listing fees · Cancel anytime
					</div>
				</div>

				{/* Right — seller dashboard mockup card */}
				<div className="flex-shrink-0 w-full lg:w-[380px]">
					<div className="bg-white rounded-2xl p-6 shadow-2xl relative">
						{/* Floating chip */}
						<div
							className="absolute -top-3.5 left-6 text-[11px] font-bold px-3 py-1 rounded-full"
							style={{ backgroundColor: '#FFC533', color: '#432C63' }}
						>
							90 days · zero fees
						</div>

						{/* Dashboard header */}
						<div className="flex items-center justify-between mb-4">
							<div>
								<div className="text-[13px] font-extrabold text-[#1B1B1B]">Your store</div>
								<div className="text-[11px] text-[#737373]">Dashboard overview</div>
							</div>
							<div
								className="text-[11px] font-bold px-2.5 py-1 rounded-full"
								style={{ backgroundColor: '#E8DEF7', color: '#432C63' }}
							>
								Live
							</div>
						</div>

						{/* Revenue figure */}
						<div className="mb-4">
							<div className="text-[11px] text-[#737373] mb-1">Total revenue (30d)</div>
							<div className="text-[28px] font-extrabold text-[#1B1B1B]">₱84,210</div>
							<div className="text-[12px] font-semibold" style={{ color: '#5FA88B' }}>+18.4% vs last month</div>
						</div>

						{/* Mini bar chart */}
						<div className="flex items-end gap-1.5 h-[60px] mb-5">
							<ChartBar h={28} />
							<ChartBar h={36} />
							<ChartBar h={22} />
							<ChartBar h={44} />
							<ChartBar h={32} />
							<ChartBar h={48} />
							<ChartBar h={38} active />
							<ChartBar h={54} active />
							<ChartBar h={42} active />
							<ChartBar h={60} active />
							<ChartBar h={50} active />
							<ChartBar h={56} active />
						</div>

						{/* Stats row */}
						<div className="grid grid-cols-3 gap-3">
							{[
								{ label: 'Orders', value: '1,284', sub: 'this month' },
								{ label: 'Rating', value: '4.9★', sub: '312 reviews' },
								{ label: 'Followers', value: '3.2k', sub: '+240 new' },
							].map(({ label, value, sub }) => (
								<div
									key={label}
									className="rounded-xl p-3 text-center"
									style={{ backgroundColor: '#FAF8F5' }}
								>
									<div className="text-[14px] font-extrabold text-[#1B1B1B]">{value}</div>
									<div className="text-[10px] text-[#737373] mt-0.5">{label}</div>
									<div className="text-[9.5px] text-[#737373]">{sub}</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
);
