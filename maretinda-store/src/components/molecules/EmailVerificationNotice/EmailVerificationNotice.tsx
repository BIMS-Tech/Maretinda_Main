'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { resendEmailVerification } from '@/lib/data/email-verification';

/**
 * Asks a buyer who hasn't confirmed their email yet to do so. Shown at checkout
 * (they can't pay or order until they have) and on the account dashboard.
 */
export const EmailVerificationNotice = ({
	email,
	context,
}: {
	email: string | null;
	context: 'checkout' | 'account';
}) => {
	const router = useRouter();
	const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
	const [sending, startSending] = useTransition();
	const [checking, startChecking] = useTransition();

	const resend = () =>
		startSending(async () => {
			const res = await resendEmailVerification();
			setResult(res);
			if (res.verified) router.refresh();
		});

	return (
		<div
			className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-[#1B1B1B]"
			data-testid="email-verification-notice"
			role="status"
		>
			<p className="text-[15px] font-semibold">
				{context === 'checkout'
					? 'Confirm your email to place your order'
					: 'Please confirm your email address'}
			</p>
			<p className="mt-1 text-sm leading-relaxed text-black/70">
				We sent a confirmation link to{' '}
				<span className="font-medium text-black">{email || 'your email'}</span>.
				Open it to confirm{context === 'checkout' ? ', then come back here to finish your order' : ''}.
				We send your order updates to this address.
			</p>
			<div className="mt-3 flex flex-wrap items-center gap-2">
				<button
					className="rounded-lg bg-[#432C63] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
					data-testid="email-verification-resend"
					disabled={sending}
					onClick={resend}
					type="button"
				>
					{sending ? 'Sending…' : 'Send a new link'}
				</button>
				<button
					className="rounded-lg border border-[#432C63]/30 bg-white px-4 py-2 text-sm font-medium text-[#432C63] disabled:opacity-60"
					disabled={checking}
					onClick={() => startChecking(() => router.refresh())}
					type="button"
				>
					{checking ? 'Checking…' : "I've confirmed it"}
				</button>
			</div>
			{result && (
				<p
					className={`mt-2 text-sm ${result.ok ? 'text-green-700' : 'text-red-600'}`}
					role="alert"
				>
					{result.message}
				</p>
			)}
		</div>
	);
};
