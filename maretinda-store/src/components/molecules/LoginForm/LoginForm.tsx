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
	<svg
		fill="none"
		height={18}
		stroke="currentColor"
		strokeWidth={1.5}
		viewBox="0 0 24 24"
		width={18}
	>
		<path
			d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<path
			d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

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
		<main className="container py-8 md:py-12">
			<div className="max-w-[460px] mx-auto px-4">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Welcome Back
					</h1>
					<p className="text-gray-500 text-sm">
						Sign in to your account to continue
					</p>
				</div>

				<div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-7">
					{/* Error Alerts */}
					{googleErrorMessage && (
						<Alert className="mb-5" variant="error">
							{googleErrorMessage}
						</Alert>
					)}
					{serverError && (
						<Alert
							className="mb-5"
							dismissible
							onClick={() => setServerError(null)}
							variant="error"
						>
							{serverError}
						</Alert>
					)}

					{/* Email / Password Form */}
					<form noValidate onSubmit={handleSubmit(submit)}>
						<div className="flex flex-col gap-4">
							{/* Email */}
							<LabeledInput
								autoComplete="email"
								disabled={isLoading}
								error={errors.email as FieldError}
								important
								inputClassName="border border-gray-300 bg-white rounded-lg h-11 px-3 w-full text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								label="Email address"
								labelClassName="text-sm font-medium text-gray-700"
								placeholder="you@example.com"
								type="email"
								{...register('email')}
							/>

							{/* Password with toggle */}
							<div className="flex flex-col gap-1">
								<div className="flex items-center justify-between">
									<p className="text-sm font-medium text-gray-700">
										Password{' '}
										<span className="text-red-500/50">*</span>
									</p>
									<Link
										className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
										href="/forgot-password"
										tabIndex={isLoading ? -1 : undefined}
									>
										Forgot password?
									</Link>
								</div>
								<div className="relative">
									<input
										autoComplete="current-password"
										className={`w-full border ${errors.password ? 'border-red-400' : 'border-gray-300'} bg-white rounded-lg h-11 px-3 pr-10 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
										disabled={isLoading}
										placeholder="••••••••"
										type={showPassword ? 'text' : 'password'}
										{...register('password')}
									/>
									<button
										className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
										onClick={() => setShowPassword((v) => !v)}
										tabIndex={-1}
										type="button"
									>
										{showPassword ? (
											<HideIcon color="#9ca3af" size={18} />
										) : (
											<EyeIcon />
										)}
									</button>
								</div>
								{errors.password && (
									<p className="text-xs text-red-500 mt-0.5">
										{(errors.password as FieldError).message}
									</p>
								)}
							</div>

							{/* Remember me */}
							<Checkbox
								checked={watch('remember')}
								label="Remember me"
								labelClassName="flex items-center gap-2 text-sm text-gray-600 cursor-pointer w-fit"
								{...register('remember')}
							/>

							{/* Submit */}
							<button
								className="w-full h-11 rounded-lg bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center mt-1"
								disabled={isLoading}
								type="submit"
							>
								{loadingState === 'login' ? (
									<Spinner color="white" size={18} />
								) : (
									'Sign In'
								)}
							</button>
						</div>
					</form>

					{/* Divider */}
					<div className="flex items-center gap-3 my-6">
						<div className="flex-1 h-px bg-gray-200" />
						<span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
							or
						</span>
						<div className="flex-1 h-px bg-gray-200" />
					</div>

					{/* Social Login */}
					<div className="flex flex-col gap-3">
						<button
							className="relative flex items-center justify-center w-full h-11 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed gap-2"
							disabled={isLoading}
							onClick={handleGoogleLogin}
							type="button"
						>
							{loadingState === 'google' ? (
								<Spinner color="#374151" size={18} />
							) : (
								<>
									<GoogleIcon />
									Continue with Google
								</>
							)}
						</button>

						<button
							className="flex items-center justify-center w-full h-11 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-400 cursor-not-allowed gap-2"
							disabled
							type="button"
						>
							<FacebookColorIcon />
							Continue with Facebook
						</button>
					</div>

					{/* Sign up link */}
					<p className="mt-6 text-center text-sm text-gray-500">
						Don&apos;t have an account?{' '}
						<Link
							className="font-medium text-gray-900 hover:underline"
							href="/register"
						>
							Sign up
						</Link>
					</p>
				</div>
			</div>
		</main>
	);
};
