'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Notice } from '@/components/molecules/LoginForm/LoginForm';
import { EASE_OUT, MaskedText, MorphButton, type MorphState, SuccessMark } from '@/components/motion';
import { PasswordField } from '@/components/organisms/AuthShell/PasswordField';
import { PasswordHints } from '@/components/organisms/AuthShell/PasswordHints';
import { updateCustomerPassword } from '@/lib/data/customer';
import { PASSWORD_RULE, validatePassword } from '@/lib/helpers/password';
import { safeReturnTo } from '@/lib/helpers/safe-return-to';
import { useLanguage } from '@/providers/LanguageProvider';

import { type ResetPasswordFormData, resetPasswordSchema } from './schema';

/** Sets a new password from the link in the reset email. */
export const ResetPasswordForm = ({ token }: { token?: string }) => {
	const { t } = useLanguage();
	const s = t.auth.reset;
	const router = useRouter();
	const params = useSearchParams();
	const {
		formState: { errors },
		handleSubmit,
		register,
		setError: setFieldError,
		watch,
	} = useForm<ResetPasswordFormData>({
		defaultValues: { confirmPassword: '', newPassword: '' },
		resolver: zodResolver(resetPasswordSchema),
	});

	const [state, setState] = useState<MorphState>('idle');
	const [done, setDone] = useState(false);
	// An expired link can't be fixed by typing again: point to a new one
	const [linkProblem, setLinkProblem] = useState<string | null>(token ? null : s.linkMissing);
	const [error, setError] = useState<string | null>(null);
	const [shake, setShake] = useState(0);

	const password = watch('newPassword');
	const signIn = safeReturnTo(params.get('returnTo'), '/login');

	const save = async ({ newPassword, confirmPassword }: ResetPasswordFormData) => {
		setError(null);
		if (!validatePassword(newPassword).isValid) {
			setFieldError('newPassword', { message: PASSWORD_RULE });
			setShake((n) => n + 1);
			return;
		}
		if (newPassword !== confirmPassword) {
			setFieldError('confirmPassword', { message: s.passwordsDiffer });
			setShake((n) => n + 1);
			return;
		}
		setState('busy');
		const res = await updateCustomerPassword(newPassword, token!).catch(() => ({ error: s.resetFailed, success: false }));
		if (!res?.success) {
			setState('idle');
			if (/expired|already used/i.test(String(res?.error))) setLinkProblem(s.linkExpired);
			else setError(s.resetFailed);
			setShake((n) => n + 1);
			return;
		}
		setState('done');
		setTimeout(() => setDone(true), 500);
		setTimeout(() => router.push(signIn), 3200);
	};

	return (
		<AnimatePresence initial={false} mode="wait">
			{done ? (
				<m.div animate={{ opacity: 1, x: 0 }} className="flex flex-col items-start" initial={{ opacity: 0, x: 24 }} key="done" transition={{ duration: 0.35, ease: EASE_OUT }}>
					<SuccessMark className="mb-6" size={64} />
					<h1 className="font-serif text-[34px] leading-[1.1] tracking-[-0.01em] text-[#1B1B1B]" data-testid="reset-done">
						<MaskedText play text={s.resetDone} />
					</h1>
					<p className="rise-in mt-3 text-[14px] leading-relaxed text-[#404040]">{s.resetDoneText}</p>
					<Link className="press mt-7 flex h-12 w-full items-center justify-center rounded-full bg-[#432C63] text-[14px] font-bold text-white hover:bg-[#372248]" href={signIn}>
						{s.signInNow}
					</Link>
				</m.div>
			) : linkProblem ? (
				<m.div animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} initial={{ opacity: 0, x: 24 }} key="link" transition={{ duration: 0.35, ease: EASE_OUT }}>
					<span className="pop-in mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#FDEEEE] text-[#A12B2B]">
						<svg aria-hidden="true" fill="none" height="28" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width="28">
							<path d="M10 14a3.5 3.5 0 005 0l3-3a3.5 3.5 0 00-5-5l-.5.5M14 10a3.5 3.5 0 00-5 0l-3 3a3.5 3.5 0 005 5l.5-.5M4 4l16 16" />
						</svg>
					</span>
					<h1 className="font-serif text-[34px] leading-[1.1] tracking-[-0.01em] text-[#1B1B1B]">
						<MaskedText play text={s.resetTitle} />
					</h1>
					<p className="rise-in mt-3 text-[14px] leading-relaxed text-[#404040]" data-testid="reset-link-problem">
						{linkProblem}
					</p>
					<div className="mt-7 flex flex-col gap-2.5">
						<Link className="press flex h-12 w-full items-center justify-center rounded-full bg-[#432C63] text-[14px] font-bold text-white hover:bg-[#372248]" href="/forgot-password">
							{s.askNewLink}
						</Link>
						<Link className="flex h-12 w-full items-center justify-center rounded-full border border-[#EAE5F0] bg-white text-[14px] font-semibold text-[#432C63] hover:border-[#432C63]/40" href={signIn}>
							{s.backToSignIn}
						</Link>
					</div>
				</m.div>
			) : (
				<m.div animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} initial={{ opacity: 0, x: -24 }} key="form" transition={{ duration: 0.35, ease: EASE_OUT }}>
					<h1 className="font-serif text-[38px] leading-[1.1] tracking-[-0.01em] text-[#1B1B1B]">
						<MaskedText play text={s.resetTitle} />
					</h1>
					<p className="rise-in mb-7 mt-1.5 text-[13.5px] text-[#737373]">{s.resetDesc}</p>

					<AnimatePresence>{error && <Notice key={error}>{error}</Notice>}</AnimatePresence>

					<m.form animate={shake ? { x: [0, -7, 6, -4, 2, 0] } : undefined} noValidate onSubmit={handleSubmit(save)} transition={{ duration: 0.4 }}>
						<div className="flex flex-col gap-4">
							<div>
								<PasswordField
									autoComplete="new-password"
									autoFocus
									disabled={state !== 'idle'}
									error={errors.newPassword?.message}
									label={s.newPassword}
									placeholder="••••••••"
									{...register('newPassword')}
								/>
								<PasswordHints password={password} />
							</div>
							<PasswordField
								autoComplete="new-password"
								disabled={state !== 'idle'}
								error={errors.confirmPassword?.message}
								label={s.confirmPassword}
								placeholder="••••••••"
								{...register('confirmPassword')}
							/>
							<MorphButton
								busy={s.saving}
								className="mt-1 flex h-12 w-full items-center justify-center rounded-full bg-[#432C63] text-[14px] font-bold text-white hover:bg-[#372248] disabled:opacity-70"
								disabled={state !== 'idle'}
								done={s.saved}
								idle={s.saveBtn}
								state={state}
								type="submit"
							/>
						</div>
					</m.form>

					<p className="mt-7 text-center text-[13px] text-[#737373]">
						<Link className="font-bold text-[#432C63]" href={signIn}>
							<span className="link-line">← {s.backToSignIn}</span>
						</Link>
					</p>
				</m.div>
			)}
		</AnimatePresence>
	);
};
