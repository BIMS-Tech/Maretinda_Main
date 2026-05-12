const PILLARS = [
	{
		icon: (
			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#432C63" strokeWidth="1.8">
				<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
				<path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
		),
		title: 'Buyer Protection',
		body: 'Full refund if your order doesn\'t arrive or isn\'t as described. Shop with complete confidence — we\'ve got your back.',
		cta: 'Learn more',
		href: '/buyer-protection',
	},
	{
		icon: (
			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#432C63" strokeWidth="1.8">
				<rect x="1" y="3" width="15" height="13" rx="2" />
				<path d="M16 8h4l3 3v5h-7V8z" />
				<circle cx="5.5" cy="18.5" r="2.5" />
				<circle cx="18.5" cy="18.5" r="2.5" />
			</svg>
		),
		title: 'Nationwide Delivery',
		body: 'Fast shipping to all 7,641 islands. Cash on delivery available everywhere. Free shipping on orders over ₱499.',
		cta: 'Shipping info',
		href: '/shipping',
	},
	{
		icon: (
			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#432C63" strokeWidth="1.8">
				<rect x="2" y="5" width="20" height="14" rx="2" />
				<path d="M2 10h20" />
				<path d="M7 15h2M13 15h4" strokeLinecap="round" />
			</svg>
		),
		title: 'Pay Your Way',
		body: 'GCash, Maya, credit & debit cards, online banking, or cash on delivery. Secure checkout powered by 256-bit SSL.',
		cta: 'Payment options',
		href: '/payment',
	},
];

export const TrustSection = () => (
	<section className="bg-white" style={{ borderTop: '1px solid #EDEAE3' }}>
		<div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-12 lg:py-16">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
				{PILLARS.map(({ icon, title, body, cta, href }) => (
					<div key={title} className="flex flex-col items-start gap-4">
						{/* Icon circle */}
						<div
							className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
							style={{ backgroundColor: '#F0EAF8' }}
						>
							{icon}
						</div>
						<div>
							<h3 className="text-[18px] font-extrabold text-[#1B1B1B] tracking-tight">{title}</h3>
							<p className="mt-2 text-[14px] leading-relaxed" style={{ color: '#404040' }}>{body}</p>
							<a
								href={href}
								className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold hover:underline"
								style={{ color: '#432C63' }}
							>
								{cta}
								<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
									<path d="M5 12h14M13 5l7 7-7 7" />
								</svg>
							</a>
						</div>
					</div>
				))}
			</div>
		</div>
	</section>
);
