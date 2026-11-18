'use client';

import { useEffect, useRef, useState } from 'react';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import Spinner from '@/icons/spinner';
import { confirmEmail } from '@/lib/data/email-verification';

/**
 * The page the confirmation email links to. Confirms in the browser rather
 * than on page load at the server, so a mail scanner opening the link doesn't
 * count, and a second click just says it's already done.
 */
export const VerifyEmail = ({ token }: { token?: string }) => {
	const [state, setState] = useState<{ ok: boolean; message: string } | null>(
		token ? null : { message: 'This link is missing its code. Open the link from the email again.', ok: false },
	);
	const started = useRef(false);

	useEffect(() => {
		if (!token || started.current) return;
		started.current = true;
		confirmEmail(token).then(setState);
	}, [token]);

	return (
		<main className="min-h-[60vh] py-10 md:py-16" style={{ backgroundColor: '#FAF8F5' }}>
			<div className="max-w-[440px] mx-auto px-4">
				<div className="text-center mb-8">
					<h1 className="font-serif text-[32px] tracking-[-0.01em] text-[#1B1B1B] mb-1.5">
						Confirm your email
					</h1>
				</div>
				<div
					className="bg-white rounded-2xl shadow-sm p-7 text-center"
					data-testid="verify-email"
					style={{ border: '1px solid #EDEAE3' }}
				>
					{!state ? (
						<div className="flex items-center justify-center gap-2 text-[14px] text-[#737373]">
							<Spinner /> Confirming…
						</div>
					) : (
						<>
							<p
								className={`text-[15px] ${state.ok ? 'text-[#1B1B1B]' : 'text-red-600'}`}
								data-testid={state.ok ? 'verify-email-done' : 'verify-email-failed'}
							>
								{state.message}
							</p>
							{state.ok && (
								<p className="mt-2 text-[13.5px] text-[#737373]">
									You can now place orders on Maretinda.
								</p>
							)}
							<div className="mt-6 flex flex-col gap-2">
								<LocalizedClientLink
									className="rounded-xl bg-[#432C63] px-4 py-3 text-[14px] font-medium text-white"
									href={state.ok ? '/cart' : '/user'}
								>
									{state.ok ? 'Go to my cart' : 'Go to my account'}
								</LocalizedClientLink>
								<LocalizedClientLink className="text-[13.5px] text-[#432C63] underline" href="/">
									Continue shopping
								</LocalizedClientLink>
							</div>
						</>
					)}
				</div>
			</div>
		</main>
	);
};
