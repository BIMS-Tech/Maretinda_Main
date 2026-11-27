'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import {
	type FieldError,
	type FieldValues,
	FormProvider,
	useForm,
	useFormContext,
} from 'react-hook-form';

import { LabeledInput } from '@/components/cells';
import { MaskedText, MorphButton, type MorphState } from '@/components/motion';
import { AUTH_INPUT, PasswordField } from '@/components/organisms/AuthShell/PasswordField';
import { PasswordHints } from '@/components/organisms/AuthShell/PasswordHints';
import { CAPTCHA_SITE_KEY, CaptchaWidget } from '@/components/atoms/CaptchaWidget/CaptchaWidget';
import { signup } from '@/lib/data/customer';
import { safeReturnTo } from '@/lib/helpers/safe-return-to';
import { useLanguage } from '@/providers/LanguageProvider';
import type { SignUpResult } from '@/types/auth';

import { Notice, SocialButtons, useGoogleSignIn } from '../LoginForm/LoginForm';
import { type RegisterFormData, registerFormSchema } from './schema';

const COUNTRY_CODES = [
	{ code: '+63', label: '🇵🇭 +63' },
	{ code: '+1', label: '🇺🇸 +1' },
	{ code: '+44', label: '🇬🇧 +44' },
	{ code: '+61', label: '🇦🇺 +61' },
	{ code: '+65', label: '🇸🇬 +65' },
	{ code: '+60', label: '🇲🇾 +60' },
	{ code: '+62', label: '🇮🇩 +62' },
	{ code: '+66', label: '🇹🇭 +66' },
	{ code: '+84', label: '🇻🇳 +84' },
	{ code: '+81', label: '🇯🇵 +81' },
	{ code: '+82', label: '🇰🇷 +82' },
	{ code: '+86', label: '🇨🇳 +86' },
	{ code: '+91', label: '🇮🇳 +91' },
	{ code: '+971', label: '🇦🇪 +971' },
	{ code: '+966', label: '🇸🇦 +966' },
];

export const RegisterForm = () => {
	const methods = useForm<RegisterFormData>({
		defaultValues: {
			countryCode: '',
			email: '',
			firstName: '',
			lastName: '',
			password: '',
			phone: '',
			terms: false,
		},
		resolver: zodResolver(registerFormSchema),
	});

	return (
		<FormProvider {...methods}>
			<Form />
		</FormProvider>
	);
};

const INPUT_CLASS = AUTH_INPUT;

const Form = () => {
	const { t } = useLanguage();
	const s = t.auth;

	const {
		handleSubmit,
		register,
		watch,
		formState: { errors, isSubmitting },
	} = useFormContext<RegisterFormData>();

	const router = useRouter();
	const searchParams = useSearchParams();
	const google = useGoogleSignIn();
	const [state, setState] = useState<MorphState>('idle');
	const [problem, setProblem] = useState<Exclude<SignUpResult, { ok: true }>['reason'] | 'captcha_needed' | null>(null);
	const [shake, setShake] = useState(0);

	const password = watch('password') ?? '';
	const termsChecked = watch('terms');

	const isLoading = isSubmitting || state !== 'idle' || google.busy;

	const [captchaToken, setCaptchaToken] = useState('');
	const [captchaRound, setCaptchaRound] = useState(0);

	const submit = async (data: FieldValues) => {
		setProblem(null);
		if (CAPTCHA_SITE_KEY && !captchaToken) {
			setProblem('captcha_needed');
			return;
		}
		setState('busy');
		const formData = new FormData();
		if (captchaToken) formData.append('captcha_token', captchaToken);
		formData.append('email', data.email);
		formData.append('password', data.password);
		formData.append('first_name', data.firstName);
		formData.append('last_name', data.lastName);
		formData.append('phone', `${data.countryCode}${data.phone}`);

		const result: SignUpResult = await signup(formData).catch(() => ({ ok: false, reason: 'failed' }) as const);

		if (result.ok) {
			setState('done');
			router.push(safeReturnTo(searchParams.get('returnTo'), '/user'));
			router.refresh();
			return;
		}
		setState('idle');
		setShake((n) => n + 1);
		// A captcha token works once, so a failed attempt needs a new one
		setCaptchaRound((round) => round + 1);
		setProblem(result.reason);
	};

	const email = watch('email') ?? '';
	const problems: Record<NonNullable<typeof problem>, React.ReactNode> = {
		captcha: s.captchaFailed,
		captcha_needed: s.captchaNeeded,
		exists: (
			<>
				{s.emailTaken}{' '}
				<Link className="font-bold underline underline-offset-2" href={`/login?email=${encodeURIComponent(email)}`}>
					{s.emailTakenSignIn}
				</Link>
			</>
		),
		failed: s.registerFailed,
		too_many: s.tooMany,
	};

	return (
		<div>
			<h1 className="font-serif text-[36px] leading-[1.1] tracking-[-0.01em] text-[#1B1B1B]">
				<MaskedText play text={s.createAccount} />
			</h1>
			<p className="rise-in mb-7 mt-1.5 text-[13.5px] text-[#737373]">{s.registerDesc}</p>

			<AnimatePresence>{problem && <Notice key={problem}>{problems[problem]}</Notice>}</AnimatePresence>

					<m.form animate={shake ? { x: [0, -7, 6, -4, 2, 0] } : undefined} key={shake} noValidate onSubmit={handleSubmit(submit)} transition={{ duration: 0.4 }}>
						<div className="flex flex-col gap-4">
							{/* First + Last Name */}
							<div className="grid grid-cols-2 gap-3">
								<LabeledInput
									autoComplete="given-name"
									disabled={isLoading}
									error={errors.firstName as FieldError}
									important
									inputClassName={`${INPUT_CLASS} ${errors.firstName ? 'border-red-400' : 'border-[#EAE5F0]'}`}
									label={s.firstName}
									labelClassName="text-[13px] font-semibold text-[#1B1B1B]"
									placeholder="Juan"
									{...register('firstName')}
								/>
								<LabeledInput
									autoComplete="family-name"
									disabled={isLoading}
									error={errors.lastName as FieldError}
									important
									inputClassName={`${INPUT_CLASS} ${errors.lastName ? 'border-red-400' : 'border-[#EAE5F0]'}`}
									label={s.lastName}
									labelClassName="text-[13px] font-semibold text-[#1B1B1B]"
									placeholder="dela Cruz"
									{...register('lastName')}
								/>
							</div>

							{/* Email */}
							<LabeledInput
								autoComplete="email"
								disabled={isLoading}
								error={errors.email as FieldError}
								important
								inputClassName={`${INPUT_CLASS} ${errors.email ? 'border-red-400' : 'border-[#EAE5F0]'}`}
								label={s.email}
								labelClassName="text-[13px] font-semibold text-[#1B1B1B]"
								placeholder="you@example.com"
								type="email"
								{...register('email')}
							/>

							{/* Phone */}
							<div className="flex flex-col gap-1">
								<p className="text-[13px] font-semibold text-[#1B1B1B]">
									{s.phone} <span className="text-red-400">*</span>
								</p>
								<div className="flex gap-2">
									<select
										className={`h-12 rounded-xl border ${errors.countryCode ? 'border-red-400' : 'border-[#EAE5F0]'} bg-white px-2 text-[13.5px] focus:border-[#432C63] focus:outline-none focus:ring-2 focus:ring-[#432C63]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-[110px] flex-shrink-0`}
										disabled={isLoading}
										{...register('countryCode')}
									>
										<option value="">Code</option>
										{COUNTRY_CODES.map((c) => (
											<option key={c.code} value={c.code}>{c.label}</option>
										))}
									</select>
									<input
										autoComplete="tel"
										className={`flex-1 h-12 rounded-xl border ${errors.phone ? 'border-red-400' : 'border-[#EAE5F0]'} bg-white px-3.5 text-[13.5px] focus:border-[#432C63] focus:outline-none focus:ring-2 focus:ring-[#432C63]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
										disabled={isLoading}
										placeholder="9123456789"
										type="tel"
										{...register('phone')}
									/>
								</div>
								{(errors.countryCode || errors.phone) && (
									<p className="text-[11.5px] text-red-500 mt-0.5">
										{(errors.countryCode?.message as string) || (errors.phone?.message as string)}
									</p>
								)}
							</div>

							{/* Password */}
							<div className="flex flex-col gap-1">
								<PasswordField
									autoComplete="new-password"
									disabled={isLoading}
									error={errors.password?.message}
									label={s.password}
									placeholder="Create a strong password"
									{...register('password')}
								/>

								<PasswordHints password={password} />

							</div>

							{/* Terms */}
							<div className="flex flex-col gap-1">
								<label className="flex items-start gap-2 text-[13px] cursor-pointer w-fit" style={{ color: '#404040' }}>
									<span className="relative flex-shrink-0 mt-0.5">
										<span
											className={`flex items-center justify-center w-5 h-5 rounded-md border transition-colors ${termsChecked ? 'border-[#432C63]' : 'border-[#DCDCDC]'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
											style={{ backgroundColor: termsChecked ? '#432C63' : 'white' }}
										>
											{termsChecked && (
												<svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
													<path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
												</svg>
											)}
										</span>
										<input
											className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
											disabled={isLoading}
											type="checkbox"
											{...register('terms')}
										/>
									</span>
									<span>
										{s.terms}{' '}
										<Link className="font-semibold hover:underline" style={{ color: '#432C63' }} href="/terms">
											{s.termsLink}
										</Link>{' '}
										{s.and}{' '}
										<Link className="font-semibold hover:underline" style={{ color: '#432C63' }} href="/privacy">
											{s.privacyLink}
										</Link>
									</span>
								</label>
								{errors.terms && (
									<p className="text-[11.5px] text-red-500 ml-7">{errors.terms.message as string}</p>
								)}
							</div>

							<CaptchaWidget onToken={setCaptchaToken} resetKey={captchaRound} />

							{/* Submit */}
							<MorphButton
								busy={s.creating}
								className="mt-1 flex h-12 w-full items-center justify-center rounded-full bg-[#432C63] text-[14px] font-bold text-white hover:bg-[#372248] disabled:opacity-70"
								disabled={isLoading}
								done={s.welcome}
								idle={s.registerBtn}
								state={state}
								type="submit"
							/>
						</div>
					</m.form>

					<SocialButtons disabled={isLoading} google={google} />

					{/* Login link */}
					<p className="mt-7 text-center text-[13px] text-[#737373]">
						{s.alreadyHave}{' '}
						<Link className="font-bold text-[#432C63]" href="/login">
							<span className="link-line">{s.signInBtn}</span>
						</Link>
					</p>
		</div>
	);
};
