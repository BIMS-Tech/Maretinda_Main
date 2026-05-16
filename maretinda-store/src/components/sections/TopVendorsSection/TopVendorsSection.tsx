import Link from 'next/link';

const STRIPE = 'repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 14px)';

const VENDORS = [
	{ name: 'Threadline Manila', category: 'Apparel · Quezon City', rating: 4.9, sold: '12.4k', years: '2y', bannerBg: '#E8DEF7', avatarBg: '#9B80D2', verified: true },
	{ name: 'Kape Pilipino', category: 'Coffee · Baguio', rating: 4.8, sold: '8.1k', years: '3y', bannerBg: '#E2D9C7', avatarBg: '#D9CFB8', verified: true },
	{ name: 'Casa Verde', category: 'Home goods · Cebu', rating: 4.7, sold: '5.6k', years: '1y', bannerBg: '#D9EAE2', avatarBg: '#5FA88B', verified: true },
	{ name: 'Glow Lab Cebu', category: 'Beauty · Cebu', rating: 4.9, sold: '19.8k', years: '4y', bannerBg: '#F2D9E2', avatarBg: '#D98AA1', verified: true },
];

const VerifiedBadge = () => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="#7FA8C9">
		<circle cx="12" cy="12" r="12" />
		<path d="M7 12l3.5 3.5L17 9" stroke="white" strokeWidth="2.5" fill="none" />
	</svg>
);

const StarIcon = () => (
	<svg width="11" height="11" viewBox="0 0 24 24" fill="#FFC533">
		<path d="M12 2l3 7h7l-5.5 4.5L18 22l-6-4-6 4 1.5-8.5L2 9h7z" />
	</svg>
);

export const TopVendorsSection = () => (
	<section className="bg-white">
		<div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-12 lg:py-16">
			{/* Header */}
			<div className="flex items-end justify-between mb-7 lg:mb-8 flex-wrap gap-4">
				<div>
					<div className="text-[12px] font-semibold tracking-[0.18em] uppercase" style={{ color: '#432C63' }}>Made in the Philippines</div>
					<h2 className="mt-2 font-serif tracking-[-0.01em] text-[#1a1a1a]" style={{ fontSize: '40px' }}>Top local vendors</h2>
					<p className="mt-2 text-[14px] max-w-[520px]" style={{ color: '#404040' }}>
						Direct from the makers — these verified small businesses ship nationwide with care.
					</p>
				</div>
				<Link href="/vendors" className="text-[13px] font-bold flex items-center gap-1.5 hover:underline" style={{ color: '#432C63' }}>
					All 12,800+ vendors →
				</Link>
			</div>

			{/* Vendor cards */}
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{VENDORS.map((vendor) => (
					<Link
						key={vendor.name}
						href="/vendors"
						className="rounded-2xl border bg-white overflow-hidden block transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
						style={{ borderColor: '#EDEAE3' }}
					>
						{/* Banner */}
						<div
							className="h-20"
							style={{ backgroundColor: vendor.bannerBg, backgroundImage: STRIPE }}
						/>

						{/* Card body */}
						<div className="px-4 pb-4 -mt-8">
							{/* Avatar */}
							<div
								className="w-16 h-16 rounded-full border-4 border-white overflow-hidden"
								style={{
									backgroundColor: vendor.avatarBg,
									backgroundImage: STRIPE,
									boxShadow: '0 1px 2px rgba(20,20,20,0.04)',
								}}
							/>
							{/* Name + verified */}
							<div className="mt-3 flex items-center gap-1.5">
								<h4 className="text-[15px] font-extrabold text-[#1B1B1B]">{vendor.name}</h4>
								{vendor.verified && <VerifiedBadge />}
							</div>
							<div className="text-[11.5px] mt-0.5" style={{ color: '#737373' }}>{vendor.category}</div>

							{/* Stats */}
							<div className="mt-2.5 flex items-center gap-3 text-[11.5px]">
								<span className="flex items-center gap-1">
									<StarIcon />
									<b className="text-[#1B1B1B]">{vendor.rating}</b>
								</span>
								<span className="w-[3px] h-[3px] rounded-full bg-[#1B1B1B] opacity-40 inline-block" />
								<span style={{ color: '#404040' }}>{vendor.sold} sold</span>
								<span className="w-[3px] h-[3px] rounded-full bg-[#1B1B1B] opacity-40 inline-block" />
								<span style={{ color: '#404040' }}>{vendor.years}</span>
							</div>

							{/* CTA */}
							<button
								className="mt-3 w-full h-9 rounded-full text-[12px] font-bold transition-colors border hover:border-[#432C63] hover:text-[#432C63]"
								style={{ backgroundColor: '#FAF8F5', borderColor: '#EDEAE3', color: '#1B1B1B' }}
							>
								Visit shop
							</button>
						</div>
					</Link>
				))}
			</div>
		</div>
	</section>
);
