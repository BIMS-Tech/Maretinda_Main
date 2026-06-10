import Image from 'next/image';
import Link from 'next/link';

const SHOP_LINKS = [
	{ label: 'New arrivals', href: '/categories' },
	{ label: 'Flash sales', href: '/flash-sale' },
	{ label: 'Collections', href: '/categories' },
	{ label: 'Trending now', href: '/categories' },
	{ label: 'Local brands', href: '/categories' },
];

const SELL_LINKS = [
	{ label: 'Start selling', href: '/become-seller/register' },
	{ label: 'Seller dashboard', href: '/become-seller' },
	{ label: 'How it works', href: '/become-seller' },
	{ label: 'Fees & pricing', href: '/pricing' },
	{ label: 'Seller blog', href: '#' },
];

const SUPPORT_LINKS = [
	{ label: 'Help center', href: '/help-center' },
	{ label: 'Buyer protection', href: '#' },
	{ label: 'Shipping info', href: '#' },
	{ label: 'Returns & refunds', href: '#' },
	{ label: 'Contact us', href: '#' },
];

const PAYMENT_CHIPS = ['VISA', 'Mastercard', 'GCash', 'Maya', 'GiyaPay', 'COD'];
const COURIER_CHIPS = ['LBC', 'J&T', 'Ninja Van', 'Lalamove'];

export function Footer() {
	return (
		<footer style={{ backgroundColor: '#372248' }}>
			<div className="max-w-[1360px] mx-auto px-4 lg:px-6">
				{/* Main grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 py-12 lg:py-16">
					{/* Brand col */}
					<div className="lg:col-span-2">
						<Link href="/" className="inline-flex mb-4">
							<Image
								src="/logo-m-2.png"
								alt="Maretinda"
								width={160}
								height={52}
								className="object-contain"
							/>
						</Link>
						<p className="text-[13.5px] leading-relaxed max-w-[280px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
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
									className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/20"
									style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}
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
									<div style={{ color: 'rgba(255,255,255,0.50)', fontSize: '9px', lineHeight: '1' }}>Download on</div>
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
									<div style={{ color: 'rgba(255,255,255,0.50)', fontSize: '9px', lineHeight: '1' }}>Get it on</div>
									<div className="text-white text-[12px] font-semibold leading-tight">Google Play</div>
								</div>
							</a>
						</div>
					</div>

					{/* Shop links */}
					<div>
						<h3 className="text-[12px] font-bold tracking-[0.16em] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>Shop</h3>
						<nav className="space-y-2.5">
							{SHOP_LINKS.map(({ label, href }) => (
								<Link
									key={label}
									href={href}
									className="block text-[13.5px] transition-colors hover:text-[#FFC533]"
									style={{ color: 'rgba(255,255,255,0.75)' }}
								>
									{label}
								</Link>
							))}
						</nav>
					</div>

					{/* Sell links */}
					<div>
						<h3 className="text-[12px] font-bold tracking-[0.16em] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>Sell</h3>
						<nav className="space-y-2.5">
							{SELL_LINKS.map(({ label, href }) => (
								<Link
									key={label}
									href={href}
									className="block text-[13.5px] transition-colors hover:text-[#FFC533]"
									style={{ color: 'rgba(255,255,255,0.75)' }}
								>
									{label}
								</Link>
							))}
						</nav>
					</div>

					{/* Support links */}
					<div>
						<h3 className="text-[12px] font-bold tracking-[0.16em] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>Support</h3>
						<nav className="space-y-2.5">
							{SUPPORT_LINKS.map(({ label, href }) => (
								<Link
									key={label}
									href={href}
									className="block text-[13.5px] transition-colors hover:text-[#FFC533]"
									style={{ color: 'rgba(255,255,255,0.75)' }}
								>
									{label}
								</Link>
							))}
						</nav>
						<div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
							<div className="text-[12px] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Address</div>
							<p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)' }}>
								KMC | Skyrise 4A &amp; 4B, Cebu IT Park, Cebu City, 6000 Cebu
							</p>
							<a href="mailto:maretinda@gmail.com" className="block text-[12px] mt-2 hover:text-[#FFC533] transition-colors" style={{ color: 'rgba(255,255,255,0.50)' }}>
								maretinda@gmail.com
							</a>
						</div>
					</div>
				</div>

				{/* Payment & couriers row */}
				<div className="py-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
						<div className="flex items-center gap-2 flex-wrap">
							<span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.40)' }}>We accept</span>
							{PAYMENT_CHIPS.map((chip) => (
								<span
									key={chip}
									className="h-6 px-2.5 rounded text-[10.5px] font-bold flex items-center"
									style={{ backgroundColor: 'white', color: '#432C63' }}
								>
									{chip}
								</span>
							))}
						</div>
						<div className="flex items-center gap-2 flex-wrap sm:ml-4">
							<span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.40)' }}>Couriers</span>
							{COURIER_CHIPS.map((chip) => (
								<span
									key={chip}
									className="h-6 px-2.5 rounded text-[10.5px] font-semibold flex items-center border"
									style={{ borderColor: 'rgba(255,255,255,0.20)', color: 'rgba(255,255,255,0.65)' }}
								>
									{chip}
								</span>
							))}
						</div>
					</div>
				</div>

				{/* Legal bottom bar */}
				<div
					className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4"
					style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
				>
					<p className="text-[11.5px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
						© 2026 Maretinda Inc. · DTI 123-4567-89 · BIR 001-234-567 · Powered by BIMS Technologies
					</p>
					<div className="flex items-center gap-4 text-[11.5px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
						<Link href="/privacy" className="hover:text-[#FFC533] transition-colors">Privacy</Link>
						<Link href="/terms" className="hover:text-[#FFC533] transition-colors">Terms</Link>
						<Link href="/cookies" className="hover:text-[#FFC533] transition-colors">Cookies</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
