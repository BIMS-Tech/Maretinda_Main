'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useEffect, useState } from 'react';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const KEY = 'maretinda_cookie_consent';

type Choice = 'accepted' | 'declined';

/**
 * Asks once whether analytics cookies are allowed, and loads Google Analytics
 * and the Meta Pixel only after a yes. Shown only when at least one of them is
 * configured: with nothing to consent to, there is no banner.
 */
export const CookieConsent = () => {
	const [choice, setChoice] = useState<Choice | null | 'unknown'>('unknown');

	useEffect(() => {
		try {
			const saved = window.localStorage.getItem(KEY);
			setChoice(saved === 'accepted' || saved === 'declined' ? saved : null);
		} catch {
			setChoice(null);
		}
	}, []);

	if (!GA_ID && !PIXEL_ID) return null;

	const decide = (value: Choice) => {
		try {
			window.localStorage.setItem(KEY, value);
		} catch {
			// The choice still holds for this visit
		}
		setChoice(value);
	};

	return (
		<>
			{choice === 'accepted' && GA_ID && (
				<>
					<Script
						src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
						strategy="afterInteractive"
					/>
					<Script id="ga-init" strategy="afterInteractive">
						{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
					</Script>
				</>
			)}
			{choice === 'accepted' && PIXEL_ID && (
				<Script id="meta-pixel" strategy="afterInteractive">
					{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');fbq('track','PageView');`}
				</Script>
			)}
			{choice === null && (
				<div
					aria-label="Cookie preferences"
					className="fixed inset-x-0 bottom-0 z-50 border-t bg-white p-4 shadow-lg"
					role="region"
				>
					<div className="mx-auto flex max-w-5xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
						<p className="text-sm text-gray-700">
							We use cookies to keep you signed in and your cart
							saved. With your permission we also use analytics
							cookies to understand how the site is used.{' '}
							<Link className="underline" href="/privacy">
								Privacy policy
							</Link>
						</p>
						<div className="flex shrink-0 gap-2">
							<button
								className="rounded-md border px-4 py-2 text-sm"
								onClick={() => decide('declined')}
								type="button"
							>
								Only necessary
							</button>
							<button
								className="rounded-md bg-[#432C63] px-4 py-2 text-sm text-white"
								onClick={() => decide('accepted')}
								type="button"
							>
								Accept analytics
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};
