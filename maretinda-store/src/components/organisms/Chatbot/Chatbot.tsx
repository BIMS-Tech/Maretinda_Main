'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { useLanguage } from '@/providers/LanguageProvider';

type Message = {
	id: number;
	from: 'bot' | 'user';
	text: string;
	links?: { label: string; href: string }[];
};


type BotResponse = {
	text: string;
	links?: { label: string; href: string }[];
};

const RESPONSES: Record<string, BotResponse> = {
	track: {
		text: 'To track your order, go to My Account → Orders. Each order shows a tracking number once shipped — click it to follow your package on the courier\'s site.',
		links: [{ label: 'View my orders', href: '/user/orders' }],
	},
	returns: {
		text: 'You can return most items within 7 days of delivery. Go to My Account → Orders → select the order → "Request return." Refunds are processed within 1–10 business days depending on your payment method.',
		links: [
			{ label: 'Start a return', href: '/user/orders' },
			{ label: 'Refund policy', href: '/refund-policy' },
		],
	},
	shipping: {
		text: 'Delivery times: Metro Manila 1–3 days · Luzon 3–5 days · Visayas & Mindanao 5–7 days. Couriers used include LBC, J&T, Ninja Van, and Lalamove. Free shipping promos are shown in the Flash Sale section.',
		links: [{ label: 'Shop now', href: '/categories' }],
	},
	payments: {
		text: 'We accept GCash, Maya, GiyaPay, Visa/Mastercard, and Cash on Delivery (COD). COD is available nationwide for most sellers. Split payment is not yet supported.',
		links: [{ label: 'Help Center — Payments', href: '/help-center' }],
	},
	seller: {
		text: 'Becoming a Maretinda seller is free! Register your shop, upload a valid ID, and you\'ll be approved within 1–2 business days. We charge 5% commission per sale — no listing fees.',
		links: [{ label: 'Start selling', href: '/become-seller' }],
	},
	password: {
		text: 'Go to the login page and click "Forgot password?" — enter your email and we\'ll send a reset link valid for 30 minutes. Check your spam folder if you don\'t see it.',
		links: [{ label: 'Go to login', href: '/login' }],
	},
	greeting: {
		text: 'Hello! 👋 I\'m Maretinda\'s virtual assistant. I can help with orders, shipping, returns, payments, and more. What can I help you with today?',
	},
	fallback: {
		text: 'I\'m not sure about that one! For detailed help, visit our Help Center or email our support team at support@maretinda.com.',
		links: [{ label: 'Visit Help Center', href: '/help-center' }],
	},
};

const INTENT_MAP: [RegExp, string][] = [
	[/track|where.*order|order.*status|hasn.*arrived|not.*received/i, 'track'],
	[/return|refund|exchange|money back|wrong item|damaged/i, 'returns'],
	[/ship|deliver|courier|how long|how many days|lbc|j&t|ninja|lalamove/i, 'shipping'],
	[/pay|payment|gcash|maya|cod|cash on delivery|credit|debit|visa|mastercard|card/i, 'payments'],
	[/sell|seller|seller|shop|listing|commission|payout/i, 'seller'],
	[/password|forgot|reset|login|can.*log|sign in/i, 'password'],
	[/hi|hello|hey|good morning|good afternoon|good evening|help/i, 'greeting'],
];

function matchIntent(input: string): string {
	for (const [pattern, key] of INTENT_MAP) {
		if (pattern.test(input)) return key;
	}
	return 'fallback';
}

let _id = 0;
const uid = () => ++_id;

export const Chatbot = () => {
	const { t } = useLanguage();
	const s = t.chatbot;

	const quickReplies = [
		{ label: s.quickReplies.track, key: 'track' },
		{ label: s.quickReplies.returns, key: 'returns' },
		{ label: s.quickReplies.shipping, key: 'shipping' },
		{ label: s.quickReplies.payments, key: 'payments' },
		{ label: s.quickReplies.seller, key: 'seller' },
		{ label: s.quickReplies.password, key: 'password' },
	];

	const [open, setOpen] = useState(false);
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');
	const [typing, setTyping] = useState(false);
	const bottomRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setMessages([{ id: uid(), from: 'bot', text: s.greeting }]);
	}, [s.greeting]);

	useEffect(() => {
		if (open) {
			setTimeout(() => inputRef.current?.focus(), 150);
		}
	}, [open]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, typing]);

	const sendMessage = (text: string) => {
		if (!text.trim()) return;

		const userMsg: Message = { id: uid(), from: 'user', text: text.trim() };
		setMessages((prev) => [...prev, userMsg]);
		setInput('');
		setTyping(true);

		setTimeout(() => {
			const key = matchIntent(text);
			const response = RESPONSES[key];
			setTyping(false);
			setMessages((prev) => [
				...prev,
				{ id: uid(), from: 'bot', text: response.text, links: response.links },
			]);
		}, 700 + Math.random() * 400);
	};

	return (
		<>
			{/* Floating button */}
			<button
				onClick={() => setOpen((v) => !v)}
				aria-label="Open chat support"
				className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
				style={{ backgroundColor: '#432C63' }}
			>
				{open ? (
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
						<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				) : (
					<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
					</svg>
				)}
				{/* Unread dot when closed */}
				{!open && (
					<span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: '#FFC533' }} />
				)}
			</button>

			{/* Chat panel */}
			{open && (
				<div
					className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden flex flex-col"
					style={{
						backgroundColor: 'white',
						border: '1px solid #EDEAE3',
						boxShadow: '0 20px 60px rgba(20,10,35,0.18)',
						height: '520px',
						maxHeight: 'calc(100vh - 7rem)',
					}}
				>
					{/* Header */}
					<div className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0" style={{ backgroundColor: '#432C63' }}>
						<div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
							</svg>
						</div>
						<div className="flex-1 min-w-0">
							<div className="text-[13.5px] font-bold text-white leading-tight">Maretinda Support</div>
							<div className="flex items-center gap-1.5 mt-0.5">
								<span className="w-1.5 h-1.5 rounded-full bg-green-400" />
								<span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.65)' }}>{s.online}</span>
							</div>
						</div>
						<Link
							href="/help-center"
							className="text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors hover:bg-white/20 flex-shrink-0"
							style={{ color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.25)' }}
						>
							{s.helpCenter}
						</Link>
					</div>

					{/* Messages */}
					<div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ backgroundColor: '#FAF8F5' }}>
						{messages.map((msg) => (
							<div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
								<div className="max-w-[82%]">
									<div
										className="px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed"
										style={
											msg.from === 'user'
												? { backgroundColor: '#432C63', color: 'white', borderBottomRightRadius: '4px' }
												: { backgroundColor: 'white', color: '#1B1B1B', border: '1px solid #EDEAE3', borderBottomLeftRadius: '4px' }
										}
									>
										{msg.text}
									</div>
									{msg.links && msg.links.length > 0 && (
										<div className="flex flex-wrap gap-1.5 mt-1.5">
											{msg.links.map(({ label, href }) => (
												<Link
													key={href}
													href={href}
													className="text-[11.5px] font-semibold px-3 py-1 rounded-full transition-colors hover:bg-[#432C63] hover:text-white"
													style={{ backgroundColor: '#F0EBF8', color: '#432C63', border: '1px solid #E0D6F0' }}
												>
													{label} →
												</Link>
											))}
										</div>
									)}
								</div>
							</div>
						))}

						{typing && (
							<div className="flex justify-start">
								<div className="px-4 py-3 rounded-2xl" style={{ backgroundColor: 'white', border: '1px solid #EDEAE3', borderBottomLeftRadius: '4px' }}>
									<div className="flex items-center gap-1">
										{[0, 1, 2].map((i) => (
											<span
												key={i}
												className="w-1.5 h-1.5 rounded-full animate-bounce"
												style={{ backgroundColor: '#9B80D2', animationDelay: `${i * 0.15}s` }}
											/>
										))}
									</div>
								</div>
							</div>
						)}
						<div ref={bottomRef} />
					</div>

					{/* Quick replies */}
					<div className="px-3 py-2 flex gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0" style={{ backgroundColor: 'white', borderTop: '1px solid #EDEAE3' }}>
						{quickReplies.map(({ label, key }) => (
							<button
								key={key}
								onClick={() => sendMessage(label.replace(/^[^ ]+ /, ''))}
								className="flex-shrink-0 text-[11.5px] font-semibold px-3 py-1.5 rounded-full transition-colors hover:bg-[#432C63] hover:text-white whitespace-nowrap"
								style={{ backgroundColor: '#F0EBF8', color: '#432C63', border: '1px solid #E0D6F0' }}
							>
								{label}
							</button>
						))}
					</div>

					{/* Input */}
					<form
						className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
						style={{ backgroundColor: 'white', borderTop: '1px solid #F0EBF8' }}
						onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
					>
						<input
							ref={inputRef}
							type="text"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder={s.placeholder}
							className="flex-1 text-[13px] outline-none bg-transparent"
							style={{ color: '#1B1B1B' }}
						/>
						<button
							type="submit"
							disabled={!input.trim()}
							className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-40"
							style={{ backgroundColor: '#432C63' }}
						>
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
								<line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
							</svg>
						</button>
					</form>
				</div>
			)}
		</>
	);
};
