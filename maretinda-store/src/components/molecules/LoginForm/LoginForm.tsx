'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@medusajs/ui';
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

import { Checkbox } from '@/components/atoms';
import { LabeledInput } from '@/components/cells';
import { FacebookColorIcon, GoogleIcon, HideIcon } from '@/icons';
import Spinner from '@/icons/spinner';
import { login } from '@/lib/data/customer';

import { type LoginFormData, loginFormSchema } from './schema';

type LoadingState = null | 'login' | 'google';

export const LoginForm = () => {
	const methods = useForm<LoginFormData>({
		defaultValues: { email: '', password: '', remember: false },
		resolver: zodResolver(loginFormSchema),
	});

	return (
		<FormProvider {...methods}>
			<Form />
		</FormProvider>
	);
};

const EyeIcon = () => (
	<svg fill="none" height={18} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" width={18}>
		<path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" strokeLinecap="round" strokeLinejoin="round" />
		<path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

const INPUT_CLASS = 'border bg-white rounded-xl h-11 px-3.5 w-full text-[13.5px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:border-[#432C63] focus:ring-2 focus:ring-[#432C63]/10';

const Form = () => {
	const {
		handleSubmit,
		register,
		watch,
		formState: { errors },
	} = useFormContext();
	const router = useRouter();
	const searchParams = useSearchParams();

	const googleError = searchParams.get('error');
	const googleErrorMessage =
		googleError === 'email_exists'
			? 'An account with this email already exists. Please sign in with your email and password.'
			: googleError
				? 'Google sign-in failed. Please try again.'
				: null;

	const [loadingState, setLoadingState] = useState<LoadingState>(null);
	const [serverError, setServerError] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);

	const isLoading = loadingState !== null;

	const handleGoogleLogin = async () => {
		setLoadingState('google');
		setServerError(null);
		try {
			const res = await fetch('/api/auth/google', { method: 'GET' });
			const { location } = await res.json();
			if (location) {
				window.location.href = location;
			} else {
				setLoadingState(null);
			}
		} catch {
			setLoadingState(null);
		}
	};

	const submit = async (data: FieldValues) => {
		setLoadingState('login');
		setServerError(null);

		const formData = new FormData();
		formData.append('email', data.email);
		formData.append('password', data.password);

		const res = await login(formData);

		if (typeof res === 'string' && res.includes('Error')) {
			setLoadingState(null);
			setServerError('Invalid email or password. Please try again.');
			return;
		}

		const returnTo = searchParams.get('returnTo');
		router.push(returnTo || '/user');
	};

	return (
		<main className="min-h-[60vh] py-10 md:py-16" style={{ backgroundColor: '#FAF8F5' }}>
			<div className="max-w-[440px] mx-auto px-4">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="font-serif text-[32px] tracking-[-0.01em] text-[#1B1B1B] mb-1.5">
						Welcome back
					</h1>
					<p className="text-[13.5px]" style={{ color: '#737373' }}>
						Sign in to your Maretinda account
					</p>
				</div>

				<div className="bg-white rounded-2xl shadow-sm p-7" style={{ border: '1px solid #EDEAE3' }}>
					{/* Error Alerts */}
					{googleErrorMessage && (
						<Alert className="mb-5" variant="error">{googleErrorMessage}</Alert>
					)}
					{serverError && (
						<Alert className="mb-5" dismissible onClick={() => setServerError(null)} variant="error">
							{serverError}
						</Alert>
					)}

					{/* Form */}
					<form noValidate onSubmit={handleSubmit(submit)}>
						<div className="flex flex-col gap-4">
							{/* Email */}
							<LabeledInput
								autoComplete="email"
								disabled={isLoading}
								error={errors.email as FieldError}
								important
								inputClassName={`${INPUT_CLASS} ${errors.email ? 'border-red-400' : 'border-[#EDEAE3]'}`}
								label="Email address"
								labelClassName="text-[13px] font-semibold text-[#1B1B1B]"
								placeholder="you@example.com"
								type="email"
								{...register('email')}
							/>

							{/* Password */}
							<div className="flex flex-col gap-1">
								<div className="flex items-center justify-between">
									<p className="text-[13px] font-semibold text-[#1B1B1B]">
										Password <span className="text-red-400">*</span>
									</p>
									<Link
										className="text-[12px] font-medium hover:underline transition-colors"
										style={{ color: '#432C63' }}
										href="/forgot-password"
										tabIndex={isLoading ? -1 : undefined}
									>
										Forgot password?
									</Link>
								</div>
								<div className="relative">
									<input
										autoComplete="current-password"
										className={`${INPUT_CLASS} pr-10 ${errors.password ? 'border-red-400' : 'border-[#EDEAE3]'}`}
										disabled={isLoading}
										placeholder="••••••••"
										type={showPassword ? 'text' : 'password'}
										{...register('password')}
									/>
									<button
										className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
										style={{ color: '#9B9B9B' }}
										onClick={() => setShowPassword((v) => !v)}
										tabIndex={-1}
										type="button"
									>
										{showPassword ? <HideIcon color="#9B9B9B" size={18} /> : <EyeIcon />}
									</button>
								</div>
								{errors.password && (
									<p className="text-[11.5px] text-red-500 mt-0.5">{(errors.password as FieldError).message}</p>
								)}
							</div>

							{/* Remember me */}
							<Checkbox
								checked={watch('remember')}
								label="Remember me"
								labelClassName="flex items-center gap-2 text-[13px] cursor-pointer w-fit"
								{...register('remember')}
							/>

							{/* Submit */}
							<button
								className="w-full h-11 rounded-full text-[13.5px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center mt-1"
								style={{ backgroundColor: '#432C63' }}
								disabled={isLoading}
								type="submit"
							>
								{loadingState === 'login' ? <Spinner color="white" size={18} /> : 'Sign in'}
							</button>
						</div>
					</form>

					{/* Divider */}
					<div className="flex items-center gap-3 my-6">
						<div className="flex-1 h-px" style={{ backgroundColor: '#EDEAE3' }} />
						<span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#ACACAC' }}>or</span>
						<div className="flex-1 h-px" style={{ backgroundColor: '#EDEAE3' }} />
					</div>

					{/* Social */}
					<div className="flex flex-col gap-2.5">
						<button
							className="relative flex items-center justify-center w-full h-11 rounded-full text-[13.5px] font-medium transition-colors gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FAF8F5]"
							style={{ border: '1px solid #EDEAE3', color: '#1B1B1B', backgroundColor: 'white' }}
							disabled={isLoading}
							onClick={handleGoogleLogin}
							type="button"
						>
							{loadingState === 'google' ? <Spinner color="#432C63" size={18} /> : <><GoogleIcon />Continue with Google</>}
						</button>

						<button
							className="flex items-center justify-center w-full h-11 rounded-full text-[13.5px] font-medium gap-2 cursor-not-allowed opacity-50"
							style={{ border: '1px solid #EDEAE3', color: '#737373', backgroundColor: 'white' }}
							disabled
							type="button"
						>
							<FacebookColorIcon />
							Continue with Facebook
						</button>
					</div>

					{/* Sign up link */}
					<p className="mt-6 text-center text-[13px]" style={{ color: '#737373' }}>
						Don&apos;t have an account?{' '}
						<Link className="font-bold hover:underline" style={{ color: '#432C63' }} href="/register">
							Create one free
						</Link>
					</p>
				</div>
			</div>
		</main>
	);
};
