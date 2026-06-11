'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useLanguage } from '@/providers/LanguageProvider';

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

const FAQS: Record<string, { q: string; a: string }[]> = {
	orders: [
		{
			q: 'How do I track my order?',
			a: 'Go to My Account → Orders. Each order shows its current status and tracking number once the seller ships it. Click "Track shipment" to follow it in real time on the courier\'s website.',
		},
		{
			q: 'Can I cancel or modify my order?',
			a: 'You can cancel an order within 1 hour of placing it, as long as the seller hasn\'t shipped it yet. Go to My Account → Orders → select the order → "Cancel order." Modifications (e.g. changing size or colour) are not possible after checkout — cancel and re-order instead.',
		},
		{
			q: `My order says "Delivered" but I haven't received it.`,
			a: 'First check with neighbours or household members. If still missing, contact the seller directly via Messages within 48 hours. If unresolved, raise a dispute from the order page and our team will step in.',
		},
		{
			q: 'Why was my order cancelled automatically?',
			a: 'Orders are auto-cancelled if payment isn\'t confirmed within 24 hours (for bank transfer/GCash), or if the seller marks the item as out of stock. You will receive a full refund if you were already charged.',
		},
	],
	shipping: [
		{
			q: 'What couriers does Maretinda use?',
			a: 'Delivery is handled by the individual sellers. Most use LBC, J&T Express, Ninja Van, or Lalamove for same-day within Metro Manila. You\'ll see the seller\'s supported couriers before checkout.',
		},
		{
			q: 'How long does delivery take?',
			a: 'Metro Manila: 1–3 business days. Luzon provinces: 3–5 business days. Visayas & Mindanao: 5–7 business days. Delivery times may vary during peak seasons (Holidays, 11.11, 12.12).',
		},
		{
			q: 'Is free shipping available?',
			a: 'Many sellers offer free shipping on orders above a minimum spend — look for the "Free Shipping" badge on product pages. Platform-wide free-shipping promos are announced in our Flash Sale section.',
		},
		{
			q: 'Can I change my delivery address after ordering?',
			a: 'Address changes are only possible before the seller processes the shipment. Contact the seller via Messages as soon as possible, or reach our support team.',
		},
	],
	returns: [
		{
			q: 'What is the return window?',
			a: 'Most items can be returned within 7 days of delivery for a full refund, provided they are unused, in original packaging, and with complete accessories. Perishables and customised items are non-returnable.',
		},
		{
			q: 'How do I request a return?',
			a: 'Go to My Account → Orders → select the order → "Request return." Fill in the reason and upload photos of the item. The seller will approve or decline within 2 business days.',
		},
		{
			q: 'When will I receive my refund?',
			a: 'Once the return is confirmed received: GCash/Maya refunds within 1–3 business days; credit/debit card refunds within 5–10 business days (depending on your bank); COD refunds via GCash or bank transfer within 3–5 business days.',
		},
		{
			q: 'What if the item arrived damaged or wrong?',
			a: 'Photograph the item and packaging immediately. Go to the order and click "Report an issue." We prioritise damage/wrong-item cases and aim to resolve them within 24 hours — either with a replacement or full refund.',
		},
	],
	payments: [
		{
			q: 'What payment methods are accepted?',
			a: 'We accept GCash, Maya, GiyaPay, Visa/Mastercard (credit & debit), and Cash on Delivery (COD). Bank transfer is available for selected sellers.',
		},
		{
			q: 'Is Cash on Delivery available nationwide?',
			a: 'COD is available for most sellers in Metro Manila and major provincial cities. Availability is shown at checkout. COD orders above ₱5,000 may require identity verification.',
		},
		{
			q: 'Why was my payment declined?',
			a: 'Common reasons: insufficient balance, card limits, incorrect OTP, or your bank blocking online transactions. Try a different payment method, or contact your bank. If the issue persists, reach our support.',
		},
		{
			q: 'Can I split payment across methods?',
			a: 'Split payment is not currently supported — one payment method per order. We\'re working on this feature.',
		},
	],
	account: [
		{
			q: 'How do I reset my password?',
			a: 'On the login page, click "Forgot password?" and enter your email. You\'ll receive a reset link valid for 30 minutes. Check your spam folder if it doesn\'t arrive within a few minutes.',
		},
		{
			q: 'How do I update my phone number or email?',
			a: 'Go to My Account → Settings → Personal Information. Email changes require re-verification. Phone number changes require an OTP sent to your new number.',
		},
		{
			q: 'How do I delete my account?',
			a: 'Account deletion requests can be submitted via My Account → Settings → Delete Account. Deletion is permanent and takes 30 days to complete. Outstanding orders must be resolved first.',
		},
		{
			q: 'Is my personal data secure?',
			a: 'Yes. Maretinda uses SSL/TLS encryption for all data in transit and at rest. We never share your personal information with third parties without your consent. See our Privacy Policy for full details.',
		},
	],
	selling: [
		{
			q: 'How do I become a seller on Maretinda?',
			a: 'Click "Sell on Maretinda" in the header or visit /become-vendor. Register your shop, upload a valid government ID, and agree to the Seller Terms. Approval takes 1–2 business days.',
		},
		{
			q: 'What fees does Maretinda charge sellers?',
			a: 'Maretinda charges a 5% commission per completed sale. There are no listing fees or monthly subscriptions. Detailed fee breakdown is available in the Seller Dashboard.',
		},
		{
			q: 'How do I get paid as a seller?',
			a: 'Payments are settled every Friday for orders delivered and confirmed the previous week. You can choose GCash, Maya, or bank transfer as your payout method in Seller Settings.',
		},
		{
			q: 'Can I sell from outside Metro Manila?',
			a: 'Absolutely — sellers from all over the Philippines are welcome. Just make sure your listed couriers serve your area. Many provincial sellers use LBC or J&T for nationwide delivery.',
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
							{filteredFaqs.length} {filteredFaqs.length !== 1 ? s.results_plural : s.results} for &ldquo;<strong>{query}</strong>&rdquo;
						</p>
						{filteredFaqs.length === 0 ? (
							<div className="text-center py-16">
								<div className="text-[48px] mb-4">🔍</div>
								<p className="text-[15px] font-semibold text-[#1B1B1B] mb-2">{s.noResults}</p>
								<p className="text-[13.5px]" style={{ color: '#737373' }}>
									{s.noResultsDesc}
								</p>
							</div>
						) : (
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
						)}
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
						{ label: s.trackMyOrder, href: '/user/orders', icon: '📦' },
						{ label: s.requestReturn, href: '/user/orders', icon: '↩️' },
						{ label: s.refundPolicy, href: '/refund-policy', icon: '💸' },
						{ label: s.becomeSeller, href: '/become-vendor', icon: '🏪' },
					].map(({ label, href, icon }) => (
						<Link
							key={label}
							href={href}
							className="flex items-center gap-3 p-4 rounded-xl border bg-white hover:border-[#432C63] hover:text-[#432C63] transition-colors text-[13px] font-semibold text-[#1B1B1B]"
							style={{ borderColor: '#EDEAE3' }}
						>
							<span className="text-[18px]">{icon}</span>
							{label}
						</Link>
					))}
				</div>
			</div>
		</div>
	);
};
