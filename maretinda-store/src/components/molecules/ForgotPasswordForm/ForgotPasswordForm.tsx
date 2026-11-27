'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { type FieldError, useForm } from 'react-hook-form';

import { LabeledInput } from '@/components/cells';
import { Notice } from '@/components/molecules/LoginForm/LoginForm';
import { EASE_OUT, MaskedText, MorphButton, type MorphState } from '@/components/motion';
import { AUTH_INPUT } from '@/components/organisms/AuthShell/PasswordField';
import { sendResetPasswordEmail } from '@/lib/data/customer';
import { useLanguage } from '@/providers/LanguageProvider';

import { type ForgotPasswordFormData, forgotPasswordFormSchema } from './schema';

/** How long before the same address can be sent another link. */
const RESEND_AFTER_S = 30;

const MailIcon = () => (
	<svg aria-hidden="true" fill="none" height="30" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24" width="30">
		<rect height="16" rx="2.5" width="20" x="2" y="4" />
		<path d="M2.5 6.5l9.5 7 9.5-7" />
	</svg>
);

/**
 * Asks for a link to set a new password. Whether or not the email has an
 * account, the answer is the same, so it can't be used to find out who shops
 * here.
 */
export const ForgotPasswordForm = () => {
	const { t } = useLanguage();
	const s = t.auth.reset;
	const params = useSearchParams();
	const {
		formState: { errors },
		handleSubmit,
		register,
		watch,
	} = useForm<ForgotPasswordFormData>({
		defaultValues: { email: params.get('email') ?? '' },
		resolver: zodResolver(forgotPasswordFormSchema),
	});

	const [state, setState] = useState<MorphState>('idle');
	const [sentTo, setSentTo] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [shake, setShake] = useState(0);
	const [wait, setWait] = useState(0);

	useEffect(() => {
		if (!wait) return;
		const timer = setTimeout(() => setWait((n) => n - 1), 1000);
		return () => clearTimeout(timer);
	}, [wait]);

	const send = async (email: string) => {
		setState('busy');
		setError(null);
		const res = await sendResetPasswordEmail(email).catch(() => ({ error: 'failed', success: false }));
		if (!res.success) {
			setState('idle');
			setError(/429|too many/i.test(String(res.error)) ? s.tooMany : s.sendFailed);
			setShake((n) => n + 1);
			return;
		}
		setState('done');
		setWait(RESEND_AFTER_S);
		// Let the button say so before the page moves on
		setTimeout(() => {
			setSentTo(email);
			setState('idle');
		}, 600);
	};

	return (
		<AnimatePresence initial={false} mode="wait">
			{sentTo ? (
				<m.div animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} initial={{ opacity: 0, x: 24 }} key="sent" transition={{ duration: 0.35, ease: EASE_OUT }}>
					<span className="pop-in mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#F6F2FB] text-[#432C63]">
						<MailIcon />
					</span>
					<h1 className="font-serif text-[34px] leading-[1.1] tracking-[-0.01em] text-[#1B1B1B]">
						<MaskedText play text={s.checkEmail} />
					</h1>
					<p className="rise-in mt-3 text-[14px] leading-relaxed text-[#404040]" data-testid="reset-sent">
						{s.sentText(sentTo)}
					</p>
					<p className="rise-in mt-2 text-[13px] leading-relaxed text-[#737373]" style={{ '--delay': '120ms' } as React.CSSProperties}>
						{s.sentTip}
					</p>

					<AnimatePresence>{error && <Notice key={error}>{error}</Notice>}</AnimatePresence>

					<div className="mt-7 flex flex-col gap-2.5">
						<Link
							className="press flex h-12 w-full items-center justify-center rounded-full bg-[#432C63] text-[14px] font-bold text-white hover:bg-[#372248]"
							href={`/login?email=${encodeURIComponent(sentTo)}`}
						>
							{s.backToSignIn}
						</Link>
						<MorphButton
							busy={s.sending}
							className="flex h-12 w-full items-center justify-center rounded-full border border-[#EAE5F0] bg-white text-[14px] font-semibold text-[#432C63] hover:border-[#432C63]/40 disabled:cursor-not-allowed disabled:text-[#A39DAC]"
							disabled={wait > 0 || state === 'busy'}
							done={s.sent}
							idle={wait > 0 ? s.sendAgainIn(wait) : s.sendAgain}
							onClick={() => send(sentTo)}
							state={state}
							type="button"
						/>
					</div>
				</m.div>
			) : (
				<m.div animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} initial={{ opacity: 0, x: -24 }} key="form" transition={{ duration: 0.35, ease: EASE_OUT }}>
					<h1 className="font-serif text-[38px] leading-[1.1] tracking-[-0.01em] text-[#1B1B1B]">
						<MaskedText play text={s.forgotTitle} />
					</h1>
					<p className="rise-in mb-7 mt-1.5 text-[13.5px] leading-relaxed text-[#737373]">{s.forgotDesc}</p>

					<AnimatePresence>{error && <Notice key={error}>{error}</Notice>}</AnimatePresence>

					<m.form
						animate={shake ? { x: [0, -7, 6, -4, 2, 0] } : undefined}
						noValidate
						onSubmit={handleSubmit(({ email }) => send(email.trim()))}
						transition={{ duration: 0.4 }}
					>
						<div className="flex flex-col gap-4">
							<LabeledInput
								autoComplete="email"
								autoFocus
								disabled={state !== 'idle'}
								error={errors.email as FieldError}
								important
								inputClassName={`${AUTH_INPUT} ${errors.email ? 'border-red-400' : 'border-[#EAE5F0]'}`}
								label={t.auth.email}
								labelClassName="text-[13px] font-semibold text-[#1B1B1B]"
								placeholder="you@example.com"
								type="email"
								{...register('email')}
							/>
							<MorphButton
								busy={s.sending}
								className="mt-1 flex h-12 w-full items-center justify-center rounded-full bg-[#432C63] text-[14px] font-bold text-white hover:bg-[#372248] disabled:opacity-70"
								disabled={state !== 'idle'}
								done={s.sent}
								idle={s.sendLink}
								state={state}
								type="submit"
							/>
						</div>
					</m.form>

					<p className="mt-7 text-center text-[13px] text-[#737373]">
						<Link className="font-bold text-[#432C63]" href={`/login${watch('email') ? `?email=${encodeURIComponent(watch('email'))}` : ''}`}>
							<span className="link-line">← {s.backToSignIn}</span>
						</Link>
					</p>
				</m.div>
			)}
		</AnimatePresence>
	);
};
