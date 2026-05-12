'use client';

import { useState } from 'react';

export const NewsletterSection = () => {
	const [email, setEmail] = useState('');
	const [submitted, setSubmitted] = useState(false);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (email.trim()) setSubmitted(true);
	};

	return (
		<section style={{ backgroundColor: '#2A1B3E' }}>
			<div className="max-w-[1360px] mx-auto px-4 lg:px-6 py-12 lg:py-16">
				<div className="flex flex-col lg:flex-row items-center justify-between gap-8">
					{/* Left copy */}
					<div className="text-white text-center lg:text-left">
						<div className="text-[12px] font-semibold tracking-[0.18em] uppercase opacity-60 mb-2">
							Stay in the loop
						</div>
						<h2 className="text-[26px] lg:text-[32px] font-extrabold tracking-tight">
							Get ₱100 off your first order
						</h2>
						<p className="mt-2 text-[14px] text-white/70 max-w-[400px]">
							Subscribe for exclusive deals, new local vendor spotlights, and flash sale early access.
						</p>
					</div>

					{/* Right form */}
					<div className="w-full lg:w-auto lg:min-w-[440px]">
						{submitted ? (
							<div
								className="rounded-2xl px-8 py-6 text-center"
								style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
							>
								<div className="text-white font-extrabold text-[18px]">You're in!</div>
								<div className="text-white/70 text-[13px] mt-1">Check your inbox for your ₱100 voucher.</div>
							</div>
						) : (
							<form onSubmit={handleSubmit} className="flex gap-2">
								<input
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="your@email.com"
									className="flex-1 h-12 rounded-full px-5 text-[14px] outline-none bg-white text-[#1B1B1B] placeholder:text-[#9CA3AF] min-w-0"
								/>
								<button
									type="submit"
									className="h-12 px-6 rounded-full text-[13.5px] font-bold flex-shrink-0 transition-opacity hover:opacity-90"
									style={{ backgroundColor: '#432C63', color: 'white' }}
								>
									Subscribe
								</button>
							</form>
						)}
						<p className="mt-3 text-[11.5px] text-white/45 text-center lg:text-left">
							No spam. Unsubscribe anytime. Use code <span className="font-bold text-white/70">HELLOMRTD</span> at checkout.
						</p>
					</div>
				</div>
			</div>
		</section>
	);
};
