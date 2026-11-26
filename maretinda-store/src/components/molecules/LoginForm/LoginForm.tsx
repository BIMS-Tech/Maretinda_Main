'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { type FieldError, FormProvider, useForm } from 'react-hook-form';

import { Checkbox } from '@/components/atoms';
import { LabeledInput } from '@/components/cells';
import { EASE_OUT, MaskedText, MorphButton, type MorphState } from '@/components/motion';
import { AUTH_INPUT, PasswordField } from '@/components/organisms/AuthShell/PasswordField';
import { FacebookColorIcon, GoogleIcon } from '@/icons';
import Spinner from '@/icons/spinner';
import { login } from '@/lib/data/customer';
import { SELLER_PANEL_URL } from '@/lib/helpers/cross-links';
import { safeReturnTo } from '@/lib/helpers/safe-return-to';
import { useLanguage } from '@/providers/LanguageProvider';
import type { LoginResult, SignInAccount } from '@/types/auth';

import { type LoginFormData, loginFormSchema } from './schema';

const GOOGLE_ERRORS: Record<string, string> = {
	auth_failed: "We couldn't sign you in with Google. Please try again.",
	customer_create_failed: "We couldn't create your account with Google. Please try again.",
	email_exists: 'An account with this email already exists. Please sign in with your email and password.',
	google_auth_failed: 'Google sign-in was cancelled.',
	link_failed: "We couldn't connect your Google account. Please sign in with your email and password.",
	link_no_token: "We couldn't connect your Google account. Please sign in with your email and password.",
	missing_params: "Google didn't finish signing you in. Please try again.",
	no_token: "We couldn't sign you in with Google. Please try again.",
	server_error: 'Something went wrong on our side. Please try again.',
};

export const Notice = ({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'info' }) => (
	<m.div
		animate={{ height: 'auto', opacity: 1 }}
		className="overflow-hidden"
		exit={{ height: 0, opacity: 0 }}
		initial={{ height: 0, opacity: 0 }}
		role="alert"
		transition={{ duration: 0.3, ease: EASE_OUT }}
	>
		<div className={`mb-5 rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${tone === 'error' ? 'bg-[#FDEEEE] text-[#A12B2B]' : 'bg-[#F6F2FB] text-[#432C63]'}`}>{children}</div>
	</m.div>
);

export const useGoogleSignIn = () => {
	const [busy, setBusy] = useState(false);
	const start = async () => {
		setBusy(true);
		try {
			const res = await fetch('/api/auth/google', { method: 'GET' });
			const { location } = await res.json();
			if (location) {
				window.location.href = location;
				return;
			}
		} catch {
			// Falls through to the button being usable again
		}
		setBusy(false);
	};
	return { busy, start };
};

export const SocialButtons = ({ disabled, google }: { disabled: boolean; google: ReturnType<typeof useGoogleSignIn> }) => {
	const { t } = useLanguage();
	return (
		<>
			<div className="my-6 flex items-center gap-3">
				<div className="h-px flex-1 bg-[#EDE8F2]" />
				<span className="text-[11px] font-semibold uppercase tracking-wider text-[#ACACAC]">{t.auth.orDivider}</span>
				<div className="h-px flex-1 bg-[#EDE8F2]" />
			</div>
			<div className="flex flex-col gap-2.5">
				<button
					className="press relative flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#EAE5F0] bg-white text-[13.5px] font-medium text-[#1B1B1B] hover:border-[#432C63]/40 disabled:cursor-not-allowed disabled:opacity-50"
					disabled={disabled || google.busy}
					onClick={google.start}
					type="button"
				>
					{google.busy ? <Spinner color="#432C63" size={18} /> : <><GoogleIcon />{t.auth.continueGoogle}</>}
				</button>
				<button className="flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-full border border-[#EAE5F0] bg-white text-[13.5px] font-medium text-[#737373] opacity-50" disabled type="button">
					<FacebookColorIcon />
					{t.auth.continueFacebook}
				</button>
			</div>
		</>
	);
};

export const LoginForm = () => {
	const { t } = useLanguage();
	const s = t.auth;
	const router = useRouter();
	const searchParams = useSearchParams();
	const google = useGoogleSignIn();
	const form = useForm<LoginFormData>({
		defaultValues: { email: searchParams.get('email') ?? '', password: '', remember: false },
		resolver: zodResolver(loginFormSchema),
	});
	const {
		formState: { errors },
		handleSubmit,
		register,
		watch,
	} = form;

	const [state, setState] = useState<MorphState>('idle');
	const [error, setError] = useState<string | null>(null);
	const [account, setAccount] = useState<SignInAccount | null>(null);
	const [shake, setShake] = useState(0);

	const googleError = searchParams.get('error');
	const notice = error ?? (googleError ? (GOOGLE_ERRORS[googleError] ?? "We couldn't sign you in with Google. Please try again.") : null);
	const busy = state !== 'idle' || google.busy;

	const REASONS: Record<Exclude<Extract<LoginResult, { ok: false }>['reason'], 'no_shopper_account'>, string> = {
		existing_shopper: s.existingShopper,
		failed: s.signInFailed,
		invalid: s.wrongPassword,
		too_many: s.tooMany,
	};

	const submit = async (data: LoginFormData, startShopping = false) => {
		setState('busy');
		setError(null);
		const body = new FormData();
		body.append('email', data.email);
		body.append('password', data.password);
		if (startShopping) body.append('start_shopping', '1');

		// The network can drop between here and the store's own server
		const result: LoginResult = await login(body).catch(() => ({ ok: false, reason: 'failed' }) as const);

		if (result.ok) {
			setState('done');
			router.push(safeReturnTo(searchParams.get('returnTo'), '/user'));
			router.refresh();
			return;
		}
		setState('idle');
		if (result.reason === 'no_shopper_account') {
			setAccount(result.account);
			return;
		}
		setError(REASONS[result.reason]);
		setShake((n) => n + 1);
	};

	return (
		<FormProvider {...form}>
			<AnimatePresence initial={false} mode="wait">
				{account ? (
					<m.div animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} initial={{ opacity: 0, x: 24 }} key="account" transition={{ duration: 0.35, ease: EASE_OUT }}>
						<OtherAccount
							account={account}
							error={error}
							google={google}
							onBack={() => {
								setAccount(null);
								setError(null);
								form.setValue('password', '');
							}}
							onStart={() => submit(form.getValues(), true)}
							state={state}
						/>
					</m.div>
				) : (
					<m.div animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} initial={{ opacity: 0, x: -24 }} key="form" transition={{ duration: 0.35, ease: EASE_OUT }}>
						<h1 className="font-serif text-[38px] leading-[1.1] tracking-[-0.01em] text-[#1B1B1B]">
							<MaskedText play text={s.welcomeBack} />
						</h1>
						<p className="rise-in mb-7 mt-1.5 text-[13.5px] text-[#737373]">{s.signInDesc}</p>

						<AnimatePresence>{notice && <Notice key={notice}>{notice}</Notice>}</AnimatePresence>

						<m.form animate={shake ? { x: [0, -7, 6, -4, 2, 0] } : undefined} key={shake} noValidate onSubmit={handleSubmit((data) => submit(data))} transition={{ duration: 0.4 }}>
							<div className="flex flex-col gap-4">
								<LabeledInput
									autoComplete="email"
									disabled={busy}
									error={errors.email as FieldError}
									important
									inputClassName={`${AUTH_INPUT} ${errors.email ? 'border-red-400' : 'border-[#EAE5F0]'}`}
									label={s.email}
									labelClassName="text-[13px] font-semibold text-[#1B1B1B]"
									placeholder="you@example.com"
									type="email"
									{...register('email')}
								/>
								<PasswordField
									aside={
										<Link className="text-[12px] font-medium text-[#432C63]" href="/forgot-password">
											<span className="link-line">{s.forgotPassword}</span>
										</Link>
									}
									autoComplete="current-password"
									disabled={busy}
									error={errors.password?.message}
									label={s.password}
									placeholder="••••••••"
									{...register('password')}
								/>
								<Checkbox checked={watch('remember')} label={s.rememberMe} labelClassName="flex items-center gap-2 text-[13px] cursor-pointer w-fit" {...register('remember')} />
								<MorphButton
									busy={s.signingIn}
									className="mt-1 flex h-12 w-full items-center justify-center rounded-full bg-[#432C63] text-[14px] font-bold text-white hover:bg-[#372248] disabled:opacity-70"
									disabled={busy}
									done={s.signedIn}
									idle={s.signInBtn}
									state={state}
									type="submit"
								/>
							</div>
						</m.form>

						<SocialButtons disabled={busy} google={google} />

						<p className="mt-7 text-center text-[13px] text-[#737373]">
							{s.noAccount}{' '}
							<Link className="font-bold text-[#432C63]" href="/register">
								<span className="link-line">{s.createOneFree}</span>
							</Link>
						</p>
					</m.div>
				)}
			</AnimatePresence>
		</FormProvider>
	);
};

const ShopIcon = () => (
	<svg aria-hidden="true" fill="none" height="28" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24" width="28">
		<path d="M4 10v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9M3 7l1.500-4h15L21 7M3 7h18M3 7a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M10 20v-5h4v5" />
	</svg>
);

/**
 * The password was right, but it opens something other than a shopper account.
 * Says what, and offers to shop with the same sign-in.
 */
function OtherAccount({
	account,
	error,
	google,
	onBack,
	onStart,
	state,
}: {
	account: SignInAccount;
	error: string | null;
	google: ReturnType<typeof useGoogleSignIn>;
	onBack: () => void;
	onStart: () => void;
	state: MorphState;
}) {
	const { t } = useLanguage();
	const s = t.auth.other;
	const heading = useRef<HTMLHeadingElement>(null);
	useEffect(() => heading.current?.focus(), []);

	const shop = account.shop_name || s.yourShop;
	const { title, text } = {
		applicant: {
			text: account.application_status === 'rejected' ? s.applicantRejected : s.applicantText(shop),
			title: s.applicantTitle,
		},
		other: { text: s.otherText, title: s.otherTitle },
		seller: { text: s.sellerText(shop), title: account.first_name ? s.sellerTitleName(account.first_name) : s.sellerTitle },
		unfinished: { text: s.unfinishedText, title: s.unfinishedTitle },
	}[account.kind];

	const isSeller = account.kind === 'seller' || account.kind === 'applicant';

	return (
		<div data-kind={account.kind} data-testid="other-account">
			<span className="pop-in mb-5 flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#F6F2FB] text-[#432C63]">
				<ShopIcon />
			</span>
			<h1 className="font-serif text-[32px] leading-[1.12] tracking-[-0.01em] text-[#1B1B1B] outline-none" ref={heading} tabIndex={-1}>
				<MaskedText play text={title} />
			</h1>
			<p className="rise-in mt-3 text-[14px] leading-relaxed text-[#5B5B5B]" style={{ '--delay': '140ms' } as React.CSSProperties}>{text}</p>
			{account.email && (
				<p className="rise-in mt-4 inline-flex max-w-full items-center gap-2 rounded-full bg-[#F6F2FB] px-4 py-2 text-[13px] font-semibold text-[#432C63]" style={{ '--delay': '200ms' } as React.CSSProperties}>
					<span className="truncate">{account.email}</span>
				</p>
			)}

			<div className="mt-6">
				<AnimatePresence>{error && <Notice key={error}>{error}</Notice>}</AnimatePresence>
				{account.existing_shopper && <Notice tone="info">{s.existingShopper}</Notice>}
			</div>

			<div className="flex flex-col gap-2.5">
				{account.can_shop && (
					<MorphButton
						busy={s.settingUp}
						className="flex h-12 w-full items-center justify-center rounded-full bg-[#432C63] text-[14px] font-bold text-white hover:bg-[#372248]"
						data-testid="start-shopping"
						done={s.ready}
						idle={account.kind === 'unfinished' ? s.finish : s.startShopping}
						onClick={onStart}
						state={state}
						type="button"
					/>
				)}
				{account.existing_shopper && (
					<button className="press flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#EAE5F0] bg-white text-[13.5px] font-medium" disabled={google.busy} onClick={google.start} type="button">
						{google.busy ? <Spinner color="#432C63" size={18} /> : <><GoogleIcon />{t.auth.continueGoogle}</>}
					</button>
				)}
				{isSeller && (
					<a className="press flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#432C63] bg-white text-[14px] font-bold text-[#432C63] hover:bg-[#F6F2FB]" data-testid="open-seller-centre" href={SELLER_PANEL_URL}>
						{account.kind === 'seller' ? s.openSellerCentre : s.checkApplication}
						<svg aria-hidden="true" className="arrow" fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 24 24" width="15"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
					</a>
				)}
				{!account.can_shop && !account.existing_shopper && (
					<Link className="press flex h-12 w-full items-center justify-center rounded-full bg-[#432C63] text-[14px] font-bold text-white" href="/register">
						{s.createAnother}
					</Link>
				)}
				<button className="mt-1 h-10 text-[13px] font-semibold text-[#737373] hover:text-[#1B1B1B]" onClick={onBack} type="button">
					<span className="link-line">{s.useAnother}</span>
				</button>
			</div>
		</div>
	);
}
