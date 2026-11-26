'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';


import { useLanguage } from '@/providers/LanguageProvider';

import { searchVideos } from './helpVideos';
import { VideoLibrary, VideoResults } from './VideoLibrary';
import { SELLER_REGISTER_URL } from '@/lib/helpers/cross-links';

const TOPICS = [
	{
		icon: (
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
				<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
				<line x1="3" y1="6" x2="21" y2="6" />
				<path d="M16 10a4 4 0 0 1-8 0" />
			</svg>
		),
		title: 'Orders & Tracking',
		desc: 'Track orders, modify or cancel, and understand order statuses.',
		color: '#E8DEF7',
		accent: '#9B80D2',
		href: '#orders',
	},
	{
		icon: (
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
				<rect x="1" y="3" width="15" height="13" rx="2" />
				<path d="M16 8h4l3 5v3h-7V8z" />
				<circle cx="5.5" cy="18.5" r="2.5" />
				<circle cx="18.5" cy="18.5" r="2.5" />
			</svg>
		),
		title: 'Shipping & Delivery',
		desc: 'Delivery timelines, couriers, tracking numbers, and shipping rates.',
		color: '#D9EAE2',
		accent: '#5FA88B',
		href: '#shipping',
	},
	{
		icon: (
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
				<polyline points="1 4 1 10 7 10" />
				<path d="M3.51 15a9 9 0 1 0 .49-3" />
			</svg>
		),
		title: 'Returns & Refunds',
		desc: "How to request a return, refund timelines, and what's eligible.",
		color: '#F2D9E2',
		accent: '#D98AA1',
		href: '#returns',
	},
	{
		icon: (
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
				<rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
				<line x1="1" y1="10" x2="23" y2="10" />
			</svg>
		),
		title: 'Payments',
		desc: 'Accepted payment methods, GCash, Maya, COD, and billing issues.',
		color: '#F0E4CC',
		accent: '#E8B87A',
		href: '#payments',
	},
	{
		icon: (
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
				<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
				<circle cx="12" cy="7" r="4" />
			</svg>
		),
		title: 'Account & Security',
		desc: 'Login issues, password reset, profile settings, and data privacy.',
		color: '#D9E5F0',
		accent: '#7FA8C9',
		href: '#account',
	},
	{
		icon: (
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
				<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
				<polyline points="9 22 9 12 15 12 15 22" />
			</svg>
		),
		title: 'Selling on Maretinda',
		desc: 'Becoming a seller, listing products, managing your shop.',
		color: '#E2D9C7',
		accent: '#B8925A',
		href: '#selling',
	},
];

// Every answer here describes what the system actually does. Change them
// together with the support assistant's knowledge (backend/src/lib/assistant/knowledge).
const FAQS: Record<string, { q: string; a: string }[]> = {
	orders: [
		{
			q: 'How do I track my order?',
			a: 'Go to My Account → Orders and open the order. Once the seller ships it you will see the tracking number and a "Track parcel" link to the courier\'s tracking page. We also email you when it ships and when it is delivered.',
		},
		{
			q: 'Can I cancel or modify my order?',
			a: 'You can cancel an order yourself from its page until the seller starts preparing it, as long as it was not paid online (Cash on Delivery orders). For an order you already paid online, message the seller or write to support@maretinda.com and we will arrange the cancellation and refund. Orders cannot be changed after checkout: cancel and order again instead.',
		},
		{
			q: `My order says "Delivered" but I haven't received it.`,
			a: 'Check with neighbours or anyone at home who may have received it. If it is still missing, message the seller from the order page, and write to support@maretinda.com with your order number if it is not resolved. Please tell us as soon as you can.',
		},
		{
			q: 'Why was my order cancelled?',
			a: 'An order is cancelled when you cancel it, or when the seller or Maretinda cancels it, for example when an item is out of stock or the shop has closed. You will get an email either way. If you paid online, our support team will contact you about your refund.',
		},
	],
	shipping: [
		{
			q: 'What couriers does Maretinda use?',
			a: 'Sellers ship your order. Many book Flying Tigers through Maretinda, which currently serves selected provinces; others use their own courier. Either way, your order page shows the tracking number once it ships.',
		},
		{
			q: 'How long does delivery take?',
			a: 'It depends on where the seller ships from and where you are. As a guide: Metro Manila 1–3 business days, other parts of Luzon 3–5, Visayas and Mindanao 5–7. Peak seasons such as the holidays, 11.11 and 12.12 can add a few days.',
		},
		{
			q: 'Is free shipping available?',
			a: 'Yes. Orders of ₱499 or more (items, before shipping) ship free on standard delivery. Below that, the delivery fee is shown at checkout before you pay. Courier-quoted express options are charged at their quoted rate.',
		},
		{
			q: 'Can I change my delivery address after ordering?',
			a: 'Only before the seller ships the order. Message the seller from the order page as soon as possible. Once the parcel is booked with a courier the address cannot be changed.',
		},
	],
	returns: [
		{
			q: 'What is the return window?',
			a: 'You can ask for a return within 7 days of delivery. Your order page shows the last day. Items should be unused, in their original packaging and complete. Perishables and customised items cannot be returned.',
		},
		{
			q: 'How do I request a return?',
			a: 'Go to My Account → Orders → select the order → "Request return", choose the items and the reason, and describe the problem. The seller approves or declines it. If the seller passes it to Maretinda, our team decides. You are emailed at each step.',
		},
		{
			q: 'When will I receive my refund?',
			a: 'Once your return is approved, Maretinda support contacts you to arrange the return of the item and your refund. If you have not heard from us within 2 business days, write to support@maretinda.com.',
		},
		{
			q: 'What if the item arrived damaged or wrong?',
			a: 'Take photos of the item and the packaging straight away. Request a return from the order page, choosing the reason that fits, and send the photos to the seller through Messages. Write to support@maretinda.com if it is not resolved.',
		},
	],
	payments: [
		{
			q: 'What payment methods are accepted?',
			a: 'Online payment through GiyaPay (GCash, Visa and Mastercard, and InstaPay), and Cash on Delivery where the seller offers it. The methods available for your order are shown at checkout.',
		},
		{
			q: 'Is Cash on Delivery available?',
			a: 'Many sellers offer it. If Cash on Delivery is available for your order you will see it at checkout. You pay the courier in cash when the parcel arrives.',
		},
		{
			q: 'Why was my payment declined?',
			a: 'Common reasons: insufficient balance, card limits, an incorrect OTP, or your bank blocking online transactions. Try a different payment method, or contact your bank. If the issue persists, reach our support.',
		},
		{
			q: 'Can I split payment across methods?',
			a: 'No, each order is paid with one method.',
		},
	],
	account: [
		{
			q: 'How do I reset my password?',
			a: 'On the login page, click "Forgot password?" and enter your email. We will email you a reset link; it expires after a short time, so use it soon. Check your spam folder if it does not arrive within a few minutes.',
		},
		{
			q: 'How do I update my phone number or email?',
			a: 'Go to My Account → Settings to update your name and phone number. To change the email you sign in with, write to support@maretinda.com from your current email address.',
		},
		{
			q: 'How do I delete my account?',
			a: 'Go to My Account → Settings → Delete account, type DELETE and confirm. Deletion is permanent: your profile, saved addresses and sign-in are removed, while past orders stay on record for the shops. You can delete your account once no order is still on its way.',
		},
		{
			q: 'Is my personal data secure?',
			a: 'Connections to Maretinda are encrypted. We share your name, address and phone number only with the seller and courier who need them to deliver your order, and payment details are handled by GiyaPay. See our Privacy Policy for full details.',
		},
	],
	selling: [
		{
			q: 'How do I become a seller on Maretinda?',
			a: 'Click "Sell on Maretinda" to open the seller application. You will need your business registration details, your TIN and your business address. Our team reviews your application, usually within a few business days. Once approved, choose a plan, add your bank account and upload your business documents for verification.',
		},
		{
			q: 'What fees does Maretinda charge sellers?',
			a: 'Maretinda charges a monthly or yearly subscription — there is no commission on sales and no listing fees. Payment processing is deducted from online payments. Your first month is free, and you can change or cancel your plan anytime.',
		},
		{
			q: 'How do I get paid as a seller?',
			a: 'By bank transfer to the account in your store settings, 14 days after each order is delivered, so the buyer\'s 7-day return period has passed. Cash on Delivery money is paid the same way once the courier has sent it to Maretinda. Your seller panel shows what is waiting and when it will be paid.',
		},
		{
			q: 'Can I sell from outside Metro Manila?',
			a: 'Yes, sellers from all over the Philippines are welcome. Flying Tigers, booked through Maretinda, currently serves selected provinces; elsewhere you can ship with your own courier and add the tracking number to the order.',
		},
	],
};

const SECTION_IDS = ['orders', 'shipping', 'returns', 'payments', 'account', 'selling'] as const;
type SectionId = typeof SECTION_IDS[number];

const SECTION_LABELS: Record<SectionId, string> = {
	orders: 'Orders & Tracking',
	shipping: 'Shipping & Delivery',
	returns: 'Returns & Refunds',
	payments: 'Payments',
	account: 'Account & Security',
	selling: 'Selling on Maretinda',
};

function AccordionItem({ q, a }: { q: string; a: string }) {
	const [open, setOpen] = useState(false);
	return (
		<div
			className="border-b last:border-b-0 cursor-pointer"
			style={{ borderColor: '#EDEAE3' }}
			onClick={() => setOpen((v) => !v)}
		>
			<div className="flex items-start justify-between gap-4 py-4 px-5">
				<p className="text-[14px] font-semibold text-[#1B1B1B] leading-snug">{q}</p>
				<svg
					width="16" height="16" viewBox="0 0 24 24" fill="none"
					stroke="#9B9B9B" strokeWidth="2.2" strokeLinecap="round"
					className={`flex-shrink-0 mt-0.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
				>
					<polyline points="6 9 12 15 18 9" />
				</svg>
			</div>
			{open && (
				<div className="px-5 pb-4 text-[13.5px] leading-relaxed" style={{ color: '#404040' }}>
					{a}
				</div>
			)}
		</div>
	);
}

export const HelpCenter = () => {
	const { t } = useLanguage();
	const s = t.helpCenter;

	const [query, setQuery] = useState('');
	const [activeSection, setActiveSection] = useState<SectionId>('orders');

	// Allow deep-linking to a topic via URL hash, e.g. /help-center#shipping (footer links).
	useEffect(() => {
		const applyHash = () => {
			const id = window.location.hash.replace('#', '');
			if ((SECTION_IDS as readonly string[]).includes(id)) {
				setActiveSection(id as SectionId);
			}
		};
		applyHash();
		window.addEventListener('hashchange', applyHash);
		return () => window.removeEventListener('hashchange', applyHash);
	}, []);

	const matchingVideos = searchVideos(query);
	const filteredFaqs = query.trim().length >= 2
		? SECTION_IDS.flatMap((sec) =>
			FAQS[sec]
				.filter(({ q, a }) =>
					q.toLowerCase().includes(query.toLowerCase()) ||
					a.toLowerCase().includes(query.toLowerCase())
				)
				.map((item) => ({ ...item, section: SECTION_LABELS[sec] }))
		)
		: null;

	return (
		<div style={{ backgroundColor: '#FAF8F5' }}>
			{/* Hero */}
			<div className="py-14 lg:py-20 text-center px-4" style={{ background: 'linear-gradient(135deg, #432C63 0%, #6B3FA0 100%)' }}>
				<div className="text-[12px] font-semibold tracking-[0.18em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
					Support
				</div>
				<h1 className="font-serif text-white tracking-[-0.02em] mb-4" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
					{s.heading}
				</h1>
				<p className="text-[15px] mb-8 max-w-[460px] mx-auto" style={{ color: 'rgba(255,255,255,0.70)' }}>
					{s.subheading}
				</p>

				{/* Search */}
				<div className="relative max-w-[520px] mx-auto">
					<svg className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.2" strokeLinecap="round">
						<circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
					</svg>
					<input
						type="search"
						placeholder={s.placeholder}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="w-full h-13 pl-11 pr-5 rounded-2xl text-[14px] outline-none"
						style={{
							height: '52px',
							backgroundColor: 'rgba(255,255,255,0.15)',
							border: '1.5px solid rgba(255,255,255,0.25)',
							color: 'white',
						}}
					/>
				</div>
			</div>

			<div className="max-w-[1100px] mx-auto px-4 lg:px-6 py-12 lg:py-16">

				{/* Search results */}
				{filteredFaqs !== null ? (
					<div>
						<p className="text-[13px] mb-5" style={{ color: '#737373' }}>
							{filteredFaqs.length + matchingVideos.length}{' '}
							{filteredFaqs.length + matchingVideos.length !== 1 ? s.results_plural : s.results} for &ldquo;<strong>{query}</strong>&rdquo;
						</p>

						{matchingVideos.length > 0 && (
							<div className="mb-8">
								<h2 className="text-[13px] font-extrabold uppercase tracking-wider mb-3" style={{ color: '#432C63' }}>
									{s.videoResults}
								</h2>
								<VideoResults videos={matchingVideos} />
							</div>
						)}
						{filteredFaqs.length === 0 && matchingVideos.length === 0 ? (
							<div className="text-center py-16">
								<div className="flex justify-center mb-4">
									<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#C4BBD6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
										<circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
									</svg>
								</div>
								<p className="text-[15px] font-semibold text-[#1B1B1B] mb-2">{s.noResults}</p>
								<p className="text-[13.5px]" style={{ color: '#737373' }}>
									{s.noResultsDesc}
								</p>
							</div>
						) : filteredFaqs.length > 0 ? (
							<div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#EDEAE3' }}>
								{filteredFaqs.map(({ q, a, section }, i) => (
									<div key={i}>
										<div className="px-5 pt-3 pb-0">
											<span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F0EBF8', color: '#432C63' }}>
												{section}
											</span>
										</div>
										<AccordionItem q={q} a={a} />
									</div>
								))}
							</div>
						) : null}
					</div>
				) : (
					<>
						{/* Topic cards */}
						<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
							{TOPICS.map((topic) => {
								const id = topic.href.replace('#', '') as SectionId;
								const isActive = activeSection === id;
								return (
									<button
										key={topic.href}
										onClick={() => setActiveSection(id)}
										className="text-left rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
										style={{
											borderColor: isActive ? topic.accent : '#EDEAE3',
											backgroundColor: isActive ? topic.color : 'white',
											boxShadow: isActive ? `0 0 0 2px ${topic.accent}22` : undefined,
										}}
									>
										<div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: topic.color, color: topic.accent }}>
											{topic.icon}
										</div>
										<h3 className="text-[14px] font-extrabold text-[#1B1B1B] mb-1">{topic.title}</h3>
										<p className="text-[12.5px] leading-snug" style={{ color: '#737373' }}>{topic.desc}</p>
									</button>
								);
							})}
						</div>

						{/* Video tutorials */}
						<VideoLibrary heading={s.videoHeading} subheading={s.videoSubheading} />

						{/* FAQ accordion */}
						<div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#EDEAE3' }}>
							<div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: '#EDEAE3' }}>
								<h2 className="text-[15px] font-extrabold text-[#1B1B1B]">{SECTION_LABELS[activeSection]}</h2>
								<span className="text-[11.5px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F0EBF8', color: '#432C63' }}>
									{FAQS[activeSection].length} articles
								</span>
							</div>
							{FAQS[activeSection].map((item, i) => (
								<AccordionItem key={i} q={item.q} a={item.a} />
							))}
						</div>
					</>
				)}

				{/* Still need help */}
				<div
					className="mt-12 rounded-2xl p-8 lg:p-10 flex flex-col lg:flex-row items-center gap-6 text-center lg:text-left"
					style={{ backgroundColor: '#432C63' }}
				>
					<div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
						<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
							<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
						</svg>
					</div>
					<div className="flex-1">
						<h3 className="font-serif text-white text-[22px] tracking-[-0.01em] mb-1">{s.stillNeedHelp}</h3>
						<p className="text-[13.5px]" style={{ color: 'rgba(255,255,255,0.65)' }}>
							{s.stillNeedHelpDesc}
						</p>
					</div>
					<div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
						<a
							href="mailto:support@maretinda.com"
							className="h-11 px-6 rounded-full text-[13.5px] font-bold flex items-center gap-2 transition-opacity hover:opacity-90"
							style={{ backgroundColor: '#FFC533', color: '#432C63' }}
						>
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
							{s.emailSupport}
						</a>
						<Link
							href="/sellers"
							className="h-11 px-6 rounded-full text-[13.5px] font-bold flex items-center gap-2 transition-colors"
							style={{ border: '1.5px solid rgba(255,255,255,0.3)', color: 'white' }}
						>
							{s.browseSellers}
						</Link>
					</div>
				</div>

				{/* Popular links */}
				<div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
					{[
						{
							label: s.trackMyOrder,
							href: '/user/orders',
							icon: (
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
									<path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
								</svg>
							),
						},
						{
							label: s.requestReturn,
							href: '/user/orders',
							icon: (
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
									<polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 0 0-4-4H4" />
								</svg>
							),
						},
						{
							label: s.refundPolicy,
							href: '/help-center#returns',
							icon: (
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
									<rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M6 12h.01M18 12h.01" />
								</svg>
							),
						},
						{
							label: s.becomeSeller,
							href: SELLER_REGISTER_URL,
							icon: (
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
									<path d="M3 9 4.5 4.5h15L21 9" /><path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" /><path d="M3 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 3 0" />
								</svg>
							),
						},
					].map(({ label, href, icon }) => (
						<Link
							key={label}
							href={href}
							className="flex items-center gap-3 p-4 rounded-xl border bg-white hover:border-[#432C63] hover:text-[#432C63] transition-colors text-[13px] font-semibold text-[#1B1B1B]"
							style={{ borderColor: '#EDEAE3' }}
						>
							<span className="flex-shrink-0 text-[#432C63]">{icon}</span>
							{label}
						</Link>
					))}
				</div>
			</div>
		</div>
	);
};
