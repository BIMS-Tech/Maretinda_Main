'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { useState } from 'react';

import { EASE_OUT, MorphButton, Reveal, SectionHeading, SuccessMark } from '@/components/motion';
import { subscribeToNewsletter } from '@/lib/data/newsletter';

export const NewsletterSection = () => {
	const [email, setEmail] = useState('');
	const [submitted, setSubmitted] = useState(false);
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim()) return;
		setSending(true);
		setError(null);
		const res = await subscribeToNewsletter(email.trim());
		setSending(false);
		if (res.ok) setSubmitted(true);
		else setError(res.message ?? null);
	};

	return (
		<section style={{ backgroundColor: '#fdf2ff', borderTop: '1px solid #ECE6F1', borderBottom: '1px solid #ECE6F1' }}>
			<div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-12 lg:py-16">
				<div className="flex flex-col lg:flex-row items-center justify-between gap-8">
					{/* Left copy */}
					<div className="text-center lg:text-left">
						<SectionHeading
							className="font-serif text-[clamp(26px,3vw,36px)] leading-tight tracking-[-0.01em] text-[#1a1a1a]"
							eyebrow="Stay in the loop"
							text="Get ₱200 off your first order over ₱1,500"
						/>
						<p className="mt-2 text-[14px] max-w-[400px]" style={{ color: '#404040' }}>
							Subscribe for exclusive deals, new local seller spotlights, and flash sale early access.
						</p>
					</div>

					{/* Right form */}
					<Reveal className="w-full lg:w-auto lg:min-w-[440px]">
						<AnimatePresence initial={false} mode="wait">
							{submitted ? (
								<m.div
									animate={{ opacity: 1, scale: 1 }}
									className="flex flex-col items-center rounded-[24px] border border-[#ECE6F1] bg-white px-8 py-7 text-center"
									initial={{ opacity: 0, scale: 0.94 }}
									key="done"
									role="status"
									transition={{ duration: 0.4, ease: EASE_OUT }}
								>
									<SuccessMark size={52} />
									<div className="mt-3 text-[18px] font-extrabold text-[#432C63]">Thanks for signing up!</div>
									<div className="mt-1 text-[13px] text-[#404040]">Use code HELLOMRTD at checkout for ₱200 off your first order over ₱1,500.</div>
								</m.div>
							) : (
								<m.form className="flex gap-2" exit={{ opacity: 0, scale: 0.96 }} key="form" onSubmit={handleSubmit} transition={{ duration: 0.2 }}>
									<input
										aria-label="Email address"
										className="h-12 min-w-0 flex-1 rounded-full border border-transparent bg-white px-5 text-[14px] text-[#1B1B1B] outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-[#9CA3AF] focus:border-[#432C63] focus:ring-4 focus:ring-[#432C63]/10"
										onChange={(e) => setEmail(e.target.value)}
										placeholder="your@email.com"
										required
										type="email"
										value={email}
									/>
									<MorphButton busy="Subscribing…" className="flex h-12 flex-shrink-0 items-center justify-center rounded-full bg-[#432C63] px-6 text-[13.5px] font-bold text-white" done="Subscribed" idle="Subscribe" state={sending ? 'busy' : 'idle'} type="submit" />
								</m.form>
							)}
						</AnimatePresence>
						{error && (
							<p className="mt-2 text-[12.5px] text-center lg:text-left" role="alert" style={{ color: '#B42318' }}>
								{error}
							</p>
						)}
						<p className="mt-3 text-[11.5px] text-center lg:text-left" style={{ color: '#9B80D2' }}>
							No spam. Unsubscribe anytime. Use code <span className="font-bold" style={{ color: '#432C63' }}>HELLOMRTD</span> at checkout.
						</p>
					</Reveal>
				</div>
			</div>
		</section>
	);
};
