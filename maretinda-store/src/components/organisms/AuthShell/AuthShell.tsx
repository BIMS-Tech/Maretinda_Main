'use client';

import Image from 'next/image';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type CSSProperties, type ReactNode, Suspense } from 'react';

import { Segmented } from '@/components/motion';
import { useLanguage } from '@/providers/LanguageProvider';

const TILES = [
	{ bg: '#FFF1CC', image: '/images/featured-products/fashion.png', label: 'Fashion' },
	{ bg: '#E9DFF6', image: '/images/categories/sneakers.png', label: 'Sneakers' },
	{ bg: '#DCEBDF', image: '/images/featured-products/groceries.png', label: 'Groceries' },
	{ bg: '#FBE1D6', image: '/images/featured-products/sofa.png', label: 'Home' },
];

export function AuthShell({ children }: { children: ReactNode }) {
	const { t } = useLanguage();
	const s = t.auth;
	return (
		<main className="bg-[#FAF8F5]">
			<div className="mx-auto grid max-w-[1240px] gap-5 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:px-6 lg:py-10">
				<section className="rise-in rounded-[28px] border border-[#EFEAF4] bg-white px-5 py-8 shadow-[0_20px_60px_-30px_rgba(67,44,99,0.35)] sm:px-10 lg:px-14 lg:py-12">
					<div className="mx-auto w-full max-w-[420px]">
						<Suspense fallback={null}>
							<Tabs />
						</Suspense>
						{children}
					</div>
				</section>

				{/* What is waiting inside */}
				<aside aria-hidden="true" className="hidden grid-cols-2 grid-rows-2 gap-4 lg:grid lg:max-h-[760px]">
					{TILES.map((tile, i) => (
						<div className="pop-in group relative overflow-hidden rounded-[26px]" key={tile.label} style={{ '--delay': `${140 + i * 110}ms`, background: tile.bg } as CSSProperties}>
							<Image alt="" className="object-contain p-8 transition-transform duration-700 ease-soft group-hover:-translate-y-2 group-hover:scale-105" fill priority={i < 2} sizes="320px" src={tile.image} />
							<span className="absolute bottom-4 left-5 text-[13px] font-bold text-[#432C63]">{tile.label}</span>
						</div>
					))}
					<p className="rise-in col-span-2 rounded-[22px] bg-[#432C63] px-6 py-4 text-[13.5px] font-medium text-white/90" style={{ '--delay': '620ms' } as CSSProperties}>
						{s.shellNote}
					</p>
				</aside>
			</div>
		</main>
	);
}

function Tabs() {
	const { t } = useLanguage();
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const { locale } = useParams<{ locale: string }>();
	const here = pathname.includes('/register') ? 'register' : 'login';
	// Forgot and reset password share the page, not the choice between the two
	if (!/\/(login|register)$/.test(pathname)) return null;
	return (
		<Segmented
			className="mb-8"
			label={t.auth.tabsLabel}
			onChange={(page) => {
				const returnTo = params.get('returnTo');
				router.push(`/${locale}/${page}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`, { scroll: false });
			}}
			options={[
				{ label: t.auth.tabSignIn, value: 'login' },
				{ label: t.auth.tabRegister, value: 'register' },
			]}
			stretch
			tone="light"
			value={here}
		/>
	);
}
