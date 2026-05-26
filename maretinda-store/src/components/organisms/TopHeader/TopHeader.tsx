'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useLanguage } from '@/providers/LanguageProvider';

type Lang = 'en' | 'fil';

function readLangCookie(): Lang {
	if (typeof document === 'undefined') return 'en';
	const match = document.cookie.split('; ').find((r) => r.startsWith('maretinda_lang='));
	return match?.split('=')[1] === 'fil' ? 'fil' : 'en';
}

function setLangCookie(lang: Lang) {
	document.cookie = `maretinda_lang=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

function Dropdown({ trigger, children }: { trigger: React.ReactNode; children: React.ReactNode }) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, []);

	return (
		<div ref={ref} className="relative">
			<button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1 text-white/85 hover:text-white transition-colors">
				{trigger}
				<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
					<polyline points="6 9 12 15 18 9" />
				</svg>
			</button>
			{open && (
				<div
					className="absolute right-0 top-full mt-1.5 rounded-xl overflow-hidden z-50"
					style={{ backgroundColor: 'white', border: '1px solid #EDEAE3', boxShadow: '0 8px 24px rgba(20,10,35,0.12)', minWidth: '150px' }}
				>
					{children}
				</div>
			)}
		</div>
	);
}

const TopHeaderBanner: React.FC = () => {
	const { t } = useLanguage();
	const s = t.topBar;

	const [lang, setLang] = useState<Lang>('en');
	const [location, setLocation] = useState<string | null>(null);
	const [locating, setLocating] = useState(false);
	const [appTooltip, setAppTooltip] = useState(false);
	const params = useParams();

	useEffect(() => {
		setLang(readLangCookie());
		const saved = localStorage.getItem('maretinda_location');
		if (saved) setLocation(saved);
	}, []);

	function switchLanguage(next: Lang) {
		if (next === lang) return;
		setLangCookie(next);
		window.location.reload();
	}

	async function detectLocation() {
		if (!navigator.geolocation) { setLocation('Philippines'); return; }
		setLocating(true);
		navigator.geolocation.getCurrentPosition(
			async ({ coords }) => {
				try {
					const res = await fetch(
						`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
						{ headers: { 'Accept-Language': 'en' } },
					);
					const data = await res.json();
					const city = data.address?.city || data.address?.town || data.address?.municipality || data.address?.county || data.address?.state || 'Philippines';
					const country = data.address?.country_code?.toUpperCase() || 'PH';
					const label = `${city}, ${country}`;
					setLocation(label);
					localStorage.setItem('maretinda_location', label);
				} catch { setLocation('Philippines'); }
				finally { setLocating(false); }
			},
			() => { setLocating(false); setLocation(null); },
			{ timeout: 8000 },
		);
	}

	const locale = (params?.locale as string) || 'ph';

	return (
		<div className="w-full" style={{ backgroundColor: '#372248' }}>
			<div className="max-w-[1360px] mx-auto px-4 lg:px-6 h-9 flex items-center justify-between text-[12px] gap-4">

				{/* LEFT */}
				<div className="flex items-center gap-4 min-w-0">
					<button onClick={detectLocation} disabled={locating}
						className="flex items-center gap-1.5 text-white/85 hover:text-white transition-colors whitespace-nowrap"
					>
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
							<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" />
						</svg>
						{locating ? (
							<span className="text-white/60 italic">{s.detecting}</span>
						) : location ? (
							<><span className="text-white/60">{s.deliverTo}</span><span className="text-white font-semibold ml-1">{location}</span></>
						) : (
							<span className="text-white/70 underline underline-offset-2 decoration-dotted">{s.detectLocation}</span>
						)}
					</button>

					<span className="hidden md:block opacity-20 text-white">|</span>

					<Link href={`/${locale}/user/orders`}
						className="hidden md:inline-flex items-center gap-1.5 text-white/80 hover:text-white transition-colors whitespace-nowrap"
					>
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
							<path d="M5 12h14M13 5l7 7-7 7" />
						</svg>
						{s.trackOrder}
					</Link>

					<span className="hidden md:block opacity-20 text-white">|</span>

					<Link href={`/${locale}/vouchers`}
						className="hidden md:inline-flex items-center gap-1.5 text-white/80 hover:text-white transition-colors whitespace-nowrap"
					>
						<span className="text-[11px]">🎟️</span>
						Vouchers
					</Link>

					<span className="hidden md:block opacity-20 text-white">|</span>

					<div className="relative hidden md:block">
						<button
							onMouseEnter={() => setAppTooltip(true)} onMouseLeave={() => setAppTooltip(false)}
							onFocus={() => setAppTooltip(true)} onBlur={() => setAppTooltip(false)}
							className="flex items-center gap-1.5 text-white/80 cursor-not-allowed opacity-70"
						>
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
								<rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
							</svg>
							{s.downloadApp}
							<span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#FFC533', color: '#432C63' }}>SOON</span>
						</button>
						{appTooltip && (
							<div className="absolute left-0 top-full mt-2 px-3 py-2 rounded-lg text-[11.5px] whitespace-nowrap z-50 pointer-events-none"
								style={{ backgroundColor: '#1B1B1B', color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
								{s.appComingSoon} 🚀
								<div className="absolute -top-1 left-4 w-2 h-2 rotate-45" style={{ backgroundColor: '#1B1B1B' }} />
							</div>
						)}
					</div>
				</div>

				{/* RIGHT */}
				<div className="flex items-center gap-4 flex-shrink-0">
					<Link href={`/${locale}/become-vendor`} className="hidden sm:inline text-white/80 hover:text-white transition-colors whitespace-nowrap">
						{s.sellOn}
					</Link>

					<span className="hidden md:block opacity-20 text-white">|</span>

					<Dropdown trigger={
						<span className="flex items-center gap-1 text-white/85">
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
								<circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
								<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
							</svg>
							{s.langLabel}
						</span>
					}>
						<div className="py-1">
							{([
								{ label: 'English', sublabel: 'EN', value: 'en' as Lang },
								{ label: 'Filipino', sublabel: 'FIL', value: 'fil' as Lang },
							]).map(({ label, sublabel, value }) => (
								<button key={value} onClick={() => switchLanguage(value)}
									className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors hover:bg-[#FAF8F5]"
									style={{ color: lang === value ? '#432C63' : '#1B1B1B' }}
								>
									<span className="font-medium flex-1 text-left">{label}</span>
									<span className="text-[11px] font-bold opacity-50">{sublabel}</span>
									{lang === value && (
										<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#432C63" strokeWidth="2.8" strokeLinecap="round">
											<polyline points="20 6 9 17 4 12" />
										</svg>
									)}
								</button>
							))}
						</div>
					</Dropdown>

					<div className="flex items-center gap-1 text-white/80 cursor-default select-none" title="Philippine Peso">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
							<line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
						</svg>
						{s.currency}
					</div>
				</div>
			</div>
		</div>
	);
};

export default TopHeaderBanner;
