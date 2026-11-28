'use client';

import { useEffect, useRef, useState } from 'react';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { SuccessMark } from '@/components/motion';
import Spinner from '@/icons/spinner';
import { confirmEmail } from '@/lib/data/email-verification';
import { verifyEmailView } from '@/lib/helpers/verify-email-view';

type Result = Awaited<ReturnType<typeof confirmEmail>>;

const PRIMARY =
	'press rounded-xl bg-[#432C63] px-4 py-3 text-[14px] font-medium text-white hover:bg-[#372248]';
const SECONDARY = 'text-[13.5px] text-[#432C63] underline';

/**
 * The page the confirmation email links to. Confirms in the browser rather
 * than on page load at the server, so a mail scanner opening the link doesn't
 * count, and a second click just says it's already done.
 *
 * `viewer` is the email this browser is signed in with, if any. The link is
 * often opened on another phone or browser than the one the buyer signed up
 * on, and it only confirms the address: it never signs anyone in, so a
 * forwarded or scanned email can't be used to get into the account.
 */
export const VerifyEmail = ({
	token,
	viewer,
}: {
	token?: string;
	viewer: string | null;
}) => {
	const [result, setResult] = useState<Result | null>(
		token
			? null
			: {
					message:
						'This link is missing its code. Open the link from the email again.',
					ok: false,
				},
	);
	const started = useRef(false);

	useEffect(() => {
		if (!token || started.current) return;
		started.current = true;
		confirmEmail(token).then(setResult);
	}, [token]);

	const view = result && verifyEmailView(result, viewer);
	const email = result?.email ?? '';

	return (
		<main
			className="min-h-[60vh] py-10 md:py-16"
			style={{ backgroundColor: '#FAF8F5' }}
		>
			<div className="max-w-[440px] mx-auto px-4">
				<div className="text-center mb-8">
					<h1 className="font-serif text-[32px] tracking-[-0.01em] text-[#1B1B1B] mb-1.5">
						Confirm your email
					</h1>
				</div>
				<div
					className="bg-white rounded-2xl shadow-sm p-7 text-center"
					data-testid="verify-email"
					data-view={view ?? 'checking'}
					style={{ border: '1px solid #EDEAE3' }}
				>
					{!result || !view ? (
						<div className="flex items-center justify-center gap-2 text-[14px] text-[#737373]">
							<Spinner /> Confirming…
						</div>
					) : view === 'failed' ? (
						<>
							<p
								className="text-[15px] text-red-600"
								data-testid="verify-email-failed"
							>
								{result.message}
							</p>
							<div className="mt-6 flex flex-col gap-2">
								{/* A new link is asked for from the account page */}
								<LocalizedClientLink
									className={PRIMARY}
									href={
										viewer
											? '/user'
											: '/login?returnTo=/user'
									}
								>
									{viewer ? 'Go to my account' : 'Sign in'}
								</LocalizedClientLink>
								<LocalizedClientLink
									className={SECONDARY}
									href="/"
								>
									Continue shopping
								</LocalizedClientLink>
							</div>
						</>
					) : (
						<>
							<SuccessMark
								burst={!result.already}
								className="mx-auto mb-5"
								size={56}
							/>
							<p
								className="text-[15px] text-[#1B1B1B]"
								data-testid="verify-email-done"
							>
								{result.message}
							</p>

							{view === 'ready' && (
								<p className="mt-2 text-[13.5px] text-[#737373]">
									You can now place orders on Maretinda.
								</p>
							)}
							{view === 'sign-in' && (
								<p
									className="mt-2 text-[13.5px] leading-relaxed text-[#737373]"
									data-testid="verify-email-sign-in"
								>
									Sign in with this email to place your order
									here. Already signed in on another phone or
									browser? Carry on there: it picks up the
									confirmation by itself.
								</p>
							)}
							{view === 'other-account' && (
								<p className="mt-2 text-[13.5px] leading-relaxed text-[#737373]">
									This browser is signed in as{' '}
									<span className="font-medium text-[#1B1B1B]">
										{viewer}
									</span>
									. To order as {email}, sign out and sign in
									with that email.
								</p>
							)}
							{view === 'seller' && (
								<p className="mt-2 text-[13.5px] leading-relaxed text-[#737373]">
									Our team can now review your seller
									application. We'll email you when it's
									approved.
								</p>
							)}

							<div className="mt-6 flex flex-col gap-2">
								{view === 'ready' && (
									<LocalizedClientLink
										className={PRIMARY}
										href="/cart"
									>
										Go to my cart
									</LocalizedClientLink>
								)}
								{view === 'sign-in' && (
									<LocalizedClientLink
										className={PRIMARY}
										href={`/login?email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent('/cart')}`}
									>
										Sign in to order
									</LocalizedClientLink>
								)}
								<LocalizedClientLink
									className={
										view === 'ready' || view === 'sign-in'
											? SECONDARY
											: PRIMARY
									}
									href="/"
								>
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
