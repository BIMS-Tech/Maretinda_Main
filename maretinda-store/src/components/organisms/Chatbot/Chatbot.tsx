'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useLanguage } from '@/providers/LanguageProvider';

type Source = { title: string; url: string };

type Message = {
	id: number;
	from: 'bot' | 'user';
	text: string;
	sources?: Source[];
	/** Set while tokens are still arriving, so the bubble can show a caret. */
	streaming?: boolean;
	error?: boolean;
};

/** What the backend system prompt should answer in. */
const LANGUAGE_NAMES: Record<string, string> = {
	en: 'English',
	fil: 'Filipino (Tagalog)',
};

let _id = 0;
const uid = () => ++_id;

/**
 * Renders assistant text. The model emits plain prose with occasional "- " lists,
 * so paragraphs and list items are handled directly — pulling in a markdown
 * renderer for this would be more surface than the output justifies.
 */
function AssistantText({ text }: { text: string }) {
	const blocks = text.split(/\n{2,}/);
	return (
		<>
			{blocks.map((block, bi) => {
				const lines = block.split('\n');
				const isList = lines.every((l) => /^\s*[-*]\s+/.test(l)) && lines.length > 0;

				if (isList) {
					return (
						<ul key={bi} className={bi > 0 ? 'mt-2 space-y-1' : 'space-y-1'}>
							{lines.map((l, li) => (
								<li key={li} className="flex gap-1.5">
									<span aria-hidden style={{ color: '#9B80D2' }}>
										•
									</span>
									<span>{l.replace(/^\s*[-*]\s+/, '')}</span>
								</li>
							))}
						</ul>
					);
				}

				return (
					<p key={bi} className={bi > 0 ? 'mt-2' : undefined}>
						{block}
					</p>
				);
			})}
		</>
	);
}

export const Chatbot = () => {
	const { lang, t } = useLanguage();
	const s = t.chatbot;

	const quickReplies = [
		s.quickReplies.track,
		s.quickReplies.returns,
		s.quickReplies.shipping,
		s.quickReplies.payments,
		s.quickReplies.seller,
		s.quickReplies.password,
	];

	const [open, setOpen] = useState(false);
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');
	const [busy, setBusy] = useState(false);
	const bottomRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const abortRef = useRef<AbortController | null>(null);

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
	}, [messages]);

	// Abandoning the conversation should stop the model call, not leave it
	// streaming into a closed widget.
	useEffect(() => () => abortRef.current?.abort(), []);

	const ask = useCallback(
		async (question: string) => {
			const trimmed = question.trim();
			if (!trimmed || busy) return;

			// Snapshot the history *before* adding this turn — the backend expects
			// prior turns only, with the new question passed separately.
			const history = messages
				.filter((m) => !m.error && m.text)
				.slice(1) // drop the canned greeting; it isn't part of the conversation
				.slice(-8)
				.map((m) => ({
					role: m.from === 'user' ? ('user' as const) : ('assistant' as const),
					content: m.text,
				}));

			const botId = uid();
			setMessages((prev) => [
				...prev,
				{ id: uid(), from: 'user', text: trimmed },
				{ id: botId, from: 'bot', text: '', streaming: true },
			]);
			setInput('');
			setBusy(true);

			const controller = new AbortController();
			abortRef.current = controller;

			const fail = (text: string) =>
				setMessages((prev) =>
					prev.map((m) =>
						m.id === botId ? { ...m, text, streaming: false, error: true } : m,
					),
				);

			try {
				const res = await fetch('/api/assistant', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						question: trimmed,
						history,
						language: LANGUAGE_NAMES[lang] || 'English',
					}),
					signal: controller.signal,
				});

				if (!res.ok || !res.body) {
					const body = await res.json().catch(() => null);
					fail(
						body?.message ||
							'Sorry — I could not answer that right now. Please try again.',
					);
					return;
				}

				const reader = res.body.getReader();
				const decoder = new TextDecoder();
				let buffer = '';

				// SSE frames are separated by a blank line. A chunk can split a frame
				// anywhere, so hold the remainder in `buffer` rather than parsing
				// per-chunk.
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					const frames = buffer.split('\n\n');
					buffer = frames.pop() ?? '';

					for (const frame of frames) {
						const line = frame.split('\n').find((l) => l.startsWith('data: '));
						if (!line) continue;

						let event: any;
						try {
							event = JSON.parse(line.slice(6));
						} catch {
							continue;
						}

						if (event.type === 'delta') {
							setMessages((prev) =>
								prev.map((m) =>
									m.id === botId ? { ...m, text: m.text + event.text } : m,
								),
							);
						} else if (event.type === 'sources') {
							setMessages((prev) =>
								prev.map((m) => (m.id === botId ? { ...m, sources: event.sources } : m)),
							);
						} else if (event.type === 'error') {
							fail(event.message);
							return;
						}
					}
				}

				setMessages((prev) =>
					prev.map((m) =>
						m.id === botId
							? {
									...m,
									streaming: false,
									// A stream that ends without producing text is a failure the
									// customer would otherwise see as an empty bubble.
									text:
										m.text ||
										'Sorry — I could not answer that right now. Please try again, or email support@maretinda.com.',
									error: !m.text,
								}
							: m,
					),
				);
			} catch (err) {
				if ((err as Error)?.name === 'AbortError') {
					// Keep whatever already streamed — the customer has read it. Only an
					// empty bubble is worth removing.
					setMessages((prev) =>
						prev.flatMap((m) =>
							m.id !== botId ? [m] : m.text ? [{ ...m, streaming: false }] : [],
						),
					);
					return;
				}
				fail('Connection lost. Please check your network and try again.');
			} finally {
				setBusy(false);
				abortRef.current = null;
			}
		},
		[busy, lang, messages],
	);

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
												: {
														backgroundColor: 'white',
														color: msg.error ? '#8A5A5A' : '#1B1B1B',
														border: `1px solid ${msg.error ? '#EFD9D9' : '#EDEAE3'}`,
														borderBottomLeftRadius: '4px',
													}
										}
									>
										{msg.from === 'bot' ? <AssistantText text={msg.text} /> : msg.text}

										{/* Typing indicator lives inside the bubble that is being written,
										    so the answer grows in place instead of replacing a separate bubble. */}
										{msg.streaming && !msg.text && (
											<span className="flex items-center gap-1 py-0.5">
												{[0, 1, 2].map((i) => (
													<span
														key={i}
														className="w-1.5 h-1.5 rounded-full animate-bounce"
														style={{ backgroundColor: '#9B80D2', animationDelay: `${i * 0.15}s` }}
													/>
												))}
											</span>
										)}
										{msg.streaming && msg.text && (
											<span
												className="inline-block w-[2px] h-[13px] align-middle ml-0.5 animate-pulse"
												style={{ backgroundColor: '#9B80D2' }}
											/>
										)}
									</div>

									{msg.sources && msg.sources.length > 0 && (
										<div className="flex flex-wrap gap-1.5 mt-1.5">
											{msg.sources.map(({ title, url }) => (
												<Link
													key={url}
													href={url}
													className="text-[11.5px] font-semibold px-3 py-1 rounded-full transition-colors hover:bg-[#432C63] hover:text-white"
													style={{ backgroundColor: '#F0EBF8', color: '#432C63', border: '1px solid #E0D6F0' }}
												>
													{title} →
												</Link>
											))}
										</div>
									)}
								</div>
							</div>
						))}
						<div ref={bottomRef} />
					</div>

					{/* Quick replies */}
					<div className="px-3 py-2 flex gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0" style={{ backgroundColor: 'white', borderTop: '1px solid #EDEAE3' }}>
						{quickReplies.map((label) => (
							<button
								key={label}
								onClick={() => ask(label)}
								disabled={busy}
								className="flex-shrink-0 text-[11.5px] font-semibold px-3 py-1.5 rounded-full transition-colors hover:bg-[#432C63] hover:text-white whitespace-nowrap disabled:opacity-40 disabled:hover:bg-[#F0EBF8] disabled:hover:text-[#432C63]"
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
						onSubmit={(e) => { e.preventDefault(); ask(input); }}
					>
						<input
							ref={inputRef}
							type="text"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder={s.placeholder}
							maxLength={1000}
							disabled={busy}
							className="flex-1 text-[13px] outline-none bg-transparent disabled:opacity-60"
							style={{ color: '#1B1B1B' }}
						/>
						{busy ? (
							<button
								type="button"
								onClick={() => abortRef.current?.abort()}
								aria-label="Stop generating"
								className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
								style={{ backgroundColor: '#432C63' }}
							>
								<span className="block w-3 h-3 rounded-[2px]" style={{ backgroundColor: 'white' }} />
							</button>
						) : (
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
						)}
					</form>
				</div>
			)}
		</>
	);
};
