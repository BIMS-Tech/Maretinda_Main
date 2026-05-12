import Image from 'next/image';
import Link from 'next/link';

const SHOP_LINKS = [
	{ label: 'New arrivals', href: '/categories' },
	{ label: 'Flash sales', href: '/categories?sale=true' },
	{ label: 'Collections', href: '/collections' },
	{ label: 'Trending now', href: '/categories?sort=trending' },
	{ label: 'Local brands', href: '/vendors' },
];

const SELL_LINKS = [
	{ label: 'Start selling', href: '/seller/register' },
	{ label: 'Seller dashboard', href: '/seller' },
	{ label: 'How it works', href: '/seller/how-it-works' },
	{ label: 'Fees & pricing', href: '/seller/pricing' },
	{ label: 'Seller blog', href: '/seller/blog' },
];

const SUPPORT_LINKS = [
	{ label: 'Help center', href: '/help' },
	{ label: 'Buyer protection', href: '/buyer-protection' },
	{ label: 'Shipping info', href: '/shipping' },
	{ label: 'Returns & refunds', href: '/returns' },
	{ label: 'Contact us', href: '/contact' },
];

const PAYMENT_ICONS = [
	{ label: 'GCash', bg: '#0074D9', short: 'G' },
	{ label: 'Maya', bg: '#0ABF80', short: 'M' },
	{ label: 'Visa', bg: '#1A1F71', short: 'V' },
	{ label: 'Mastercard', bg: '#EB001B', short: 'MC' },
	{ label: 'COD', bg: '#737373', short: '$' },
];

export function Footer() {
	return (
		<footer style={{ backgroundColor: '#1B1B1B' }}>
			<div className="max-w-[1360px] mx-auto px-4 lg:px-6">
				{/* Main grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 py-12 lg:py-16">
					{/* Brand col */}
					<div className="lg:col-span-2">
						<Link href="/" className="flex items-center gap-2.5 mb-4">
							<Image
								src="/logo-m.png"
								alt="Maretinda"
								width={36}
								height={36}
								className="rounded-lg"
							/>
							<div>
								<div className="text-white font-extrabold text-[17px] leading-none tracking-tight">maretinda</div>
								<div className="text-[10px] font-semibold tracking-[0.14em] uppercase mt-0.5" style={{ color: '#9CA3AF' }}>Philippines</div>
							</div>
						</Link>
						<p className="text-[13.5px] leading-relaxed max-w-[280px]" style={{ color: '#9CA3AF' }}>
							Your complete Philippine marketplace — from fresh palengke finds to fashion-forward local brands, all in one place.
						</p>

						{/* Social icons */}
						<div className="flex items-center gap-3 mt-6">
							{[
								{ label: 'Facebook', path: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' },
								{ label: 'Instagram', path: 'M22.56 6.33A10 10 0 0 0 17.67 1.44 10 10 0 0 0 12 0a10 10 0 0 0-5.67 1.44A10 10 0 0 0 1.44 6.33 10 10 0 0 0 0 12a10 10 0 0 0 1.44 5.67A10 10 0 0 0 6.33 22.56 10 10 0 0 0 12 24a10 10 0 0 0 5.67-1.44A10 10 0 0 0 22.56 17.67 10 10 0 0 0 24 12a10 10 0 0 0-1.44-5.67zM12 7a5 5 0 1 1 0 10A5 5 0 0 1 12 7zm6.5-.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5z' },
								{ label: 'TikTok', path: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.73a4.85 4.85 0 0 1-1.01-.04z' },
							].map(({ label, path }) => (
								<a
									key={label}
									href="#"
									aria-label={label}
									className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
									style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
								>
									<svg width="15" height="15" viewBox="0 0 24 24" fill="white">
										<path d={path} />
									</svg>
								</a>
							))}
						</div>

						{/* App download buttons */}
						<div className="flex items-center gap-2.5 mt-6 flex-wrap">
							<a
								href="#"
								className="flex items-center gap-2 h-10 px-4 rounded-lg border border-white/20 hover:border-white/40 transition-colors"
							>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="white">
									<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
								</svg>
								<div>
									<div style={{ color: '#9CA3AF', fontSize: '9px', lineHeight: '1' }}>Download on</div>
									<div className="text-white text-[12px] font-semibold leading-tight">App Store</div>
								</div>
							</a>
							<a
								href="#"
								className="flex items-center gap-2 h-10 px-4 rounded-lg border border-white/20 hover:border-white/40 transition-colors"
							>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="white">
									<path d="M3.18 23.76c.3.17.66.19.99.06l11.67-6.73-2.31-2.31-10.35 8.98zM.5 1.72A1.5 1.5 0 0 0 0 2.83v18.34a1.5 1.5 0 0 0 .5 1.11l.06.05 10.27-10.27v-.24L.56 1.67.5 1.72zM22.06 10.33l-2.9-1.67-2.59 2.59 2.59 2.59 2.93-1.69c.83-.48.83-1.26-.03-1.82zM4.17.24L15.84 6.97l-2.31 2.31L3.18.3C3.51.17 3.87.2 4.17.4V.24z" />
								</svg>
								<div>
									<div style={{ color: '#9CA3AF', fontSize: '9px', lineHeight: '1' }}>Get it on</div>
									<div className="text-white text-[12px] font-semibold leading-tight">Google Play</div>
								</div>
							</a>
						</div>
					</div>

					{/* Shop links */}
					<div>
						<h3 className="text-[12px] font-bold tracking-[0.16em] uppercase mb-4" style={{ color: '#9CA3AF' }}>Shop</h3>
						<nav className="space-y-2.5">
							{SHOP_LINKS.map(({ label, href }) => (
								<Link
									key={label}
									href={href}
									className="block text-[13.5px] transition-colors hover:text-white"
									style={{ color: '#D1D5DB' }}
								>
									{label}
								</Link>
							))}
						</nav>
					</div>

					{/* Sell links */}
					<div>
						<h3 className="text-[12px] font-bold tracking-[0.16em] uppercase mb-4" style={{ color: '#9CA3AF' }}>Sell</h3>
						<nav className="space-y-2.5">
							{SELL_LINKS.map(({ label, href }) => (
								<Link
									key={label}
									href={href}
									className="block text-[13.5px] transition-colors hover:text-white"
									style={{ color: '#D1D5DB' }}
								>
									{label}
								</Link>
							))}
						</nav>
					</div>

					{/* Support links */}
					<div>
						<h3 className="text-[12px] font-bold tracking-[0.16em] uppercase mb-4" style={{ color: '#9CA3AF' }}>Support</h3>
						<nav className="space-y-2.5">
							{SUPPORT_LINKS.map(({ label, href }) => (
								<Link
									key={label}
									href={href}
									className="block text-[13.5px] transition-colors hover:text-white"
									style={{ color: '#D1D5DB' }}
								>
									{label}
								</Link>
							))}
						</nav>
						<div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
							<div className="text-[12px] font-semibold mb-1" style={{ color: '#9CA3AF' }}>Address</div>
							<p className="text-[12px] leading-relaxed" style={{ color: '#6B7280' }}>
								KMC | Skyrise 4A &amp; 4B, Cebu IT Park, Cebu City, 6000 Cebu
							</p>
							<a href="mailto:maretinda@gmail.com" className="block text-[12px] mt-2 hover:text-white transition-colors" style={{ color: '#9CA3AF' }}>
								maretinda@gmail.com
							</a>
						</div>
					</div>
				</div>

				{/* Bottom bar */}
				<div
					className="flex flex-col sm:flex-row items-center justify-between gap-4 py-5"
					style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
				>
					<p className="text-[12px]" style={{ color: '#6B7280' }}>
						© 2026 Maretinda. All rights reserved. Powered by BIMS Technologies.
					</p>

					{/* Payment methods */}
					<div className="flex items-center gap-2">
						{PAYMENT_ICONS.map(({ label, bg, short }) => (
							<div
								key={label}
								className="h-7 px-2 rounded text-white text-[10px] font-extrabold flex items-center justify-center"
								style={{ backgroundColor: bg, minWidth: '32px' }}
								title={label}
							>
								{short}
							</div>
						))}
					</div>
				</div>
			</div>
		</footer>
	);
}
