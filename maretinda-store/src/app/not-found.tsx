import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
	title: '404 — Page not found',
	description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
	return (
		<div
			className="min-h-screen flex flex-col"
			style={{ backgroundColor: '#FAF8F5' }}
		>
			{/* Minimal top bar */}
			<header className="px-6 py-5">
				<Link href="/" className="inline-flex">
					<Image
						src="/logo-m-2.png"
						alt="Maretinda"
						width={140}
						height={46}
						className="object-contain"
						priority
					/>
				</Link>
			</header>

			{/* Main content */}
			<main className="flex-1 flex flex-col items-center justify-center px-4 text-center -mt-12">
				{/* Decorative dots */}
				<div className="relative mb-8">
					<div
						className="absolute -inset-8 rounded-full opacity-[0.07]"
						style={{ backgroundColor: '#432C63' }}
					/>
					<div
						className="relative w-24 h-24 rounded-full flex items-center justify-center"
						style={{ backgroundColor: 'rgba(67,44,99,0.08)' }}
					>
						<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#432C63" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
							<circle cx="11" cy="11" r="8" />
							<path d="m21 21-4.35-4.35" />
							<path d="M11 8v3M11 14h.01" />
						</svg>
					</div>
				</div>

				{/* 404 number */}
				<div
					className="font-serif leading-none tracking-[-0.04em] select-none"
					style={{ fontSize: 'clamp(80px, 16vw, 140px)', color: '#432C63', opacity: 0.12 }}
					aria-hidden="true"
				>
					404
				</div>

				{/* Heading */}
				<h1
					className="font-serif tracking-[-0.02em] text-[#1B1B1B] -mt-4 mb-3"
					style={{ fontSize: 'clamp(26px, 4vw, 38px)' }}
				>
					Page not found
				</h1>

				<p className="text-[15px] max-w-[420px] leading-relaxed mb-8" style={{ color: '#737373' }}>
					The page you&apos;re looking for may have been moved, deleted, or never existed. Let&apos;s get you back on track.
				</p>

				{/* CTAs */}
				<div className="flex flex-col sm:flex-row items-center gap-3">
					<Link
						href="/"
						className="h-11 px-7 rounded-full text-[13.5px] font-bold text-white flex items-center gap-2 transition-opacity hover:opacity-90"
						style={{ backgroundColor: '#432C63' }}
					>
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
							<polyline points="9 22 9 12 15 12 15 22" />
						</svg>
						Go to homepage
					</Link>

					<Link
						href="/categories"
						className="h-11 px-7 rounded-full text-[13.5px] font-bold flex items-center gap-2 transition-colors hover:border-[#432C63] hover:text-[#432C63]"
						style={{ border: '1.5px solid #DCDCDC', color: '#404040', backgroundColor: 'white' }}
					>
						Browse categories
					</Link>
				</div>

				{/* Quick links */}
				<div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12.5px]" style={{ color: '#ACACAC' }}>
					{[
						{ label: 'Home', href: '/' },
						{ label: 'Sellers', href: '/sellers' },
						{ label: 'Collections', href: '/collections' },
						{ label: 'Help Center', href: '/help-center' },
					].map(({ label, href }) => (
						<Link
							key={href}
							href={href}
							className="hover:underline transition-colors hover:text-[#432C63]"
						>
							{label}
						</Link>
					))}
				</div>
			</main>

			{/* Footer strip */}
			<footer className="py-6 text-center text-[12px]" style={{ color: '#ACACAC' }}>
				© {new Date().getFullYear()} Maretinda Inc.
			</footer>
		</div>
	);
}
