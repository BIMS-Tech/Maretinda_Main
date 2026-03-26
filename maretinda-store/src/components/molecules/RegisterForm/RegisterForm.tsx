'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@medusajs/ui';
import Link from 'next/link';
import { useState } from 'react';
import {
	type FieldError,
	type FieldValues,
	FormProvider,
	useForm,
	useFormContext,
} from 'react-hook-form';

import { LabeledInput } from '@/components/cells';
import { validatePassword } from '@/components/cells/PasswordValidator/PasswordValidator';
import { FacebookColorIcon, GoogleIcon, HideIcon } from '@/icons';
import Spinner from '@/icons/spinner';
import { signup } from '@/lib/data/customer';

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

const StrengthHint = ({
	met,
	label,
}: {
	met: boolean;
	label: string;
}) => (
	<span
		className={`flex items-center gap-1 text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}
	>
		<span
			className={`inline-block w-1.5 h-1.5 rounded-full ${met ? 'bg-green-500' : 'bg-gray-300'}`}
		/>
		{label}
	</span>
);

const Form = () => {
	const {
		handleSubmit,
		register,
		watch,
		formState: { errors, isSubmitting },
	} = useFormContext<RegisterFormData>();

	const [serverError, setServerError] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);

	const password = watch('password') ?? '';
	const passwordStrength = validatePassword(password);
	const showStrength = password.length > 0;
	const termsChecked = watch('terms');

	const isLoading = isSubmitting || isGoogleLoading;

	const handleGoogleSignup = async () => {
		setIsGoogleLoading(true);
		try {
			const res = await fetch('/api/auth/google', { method: 'GET' });
			const { location } = await res.json();
			if (location) {
				window.location.href = location;
			} else {
				setIsGoogleLoading(false);
			}
		} catch {
			setIsGoogleLoading(false);
		}
	};

	const submit = async (data: FieldValues) => {
		setServerError(null);
		const formData = new FormData();
		formData.append('email', data.email);
		formData.append('password', data.password);
		formData.append('first_name', data.firstName);
		formData.append('last_name', data.lastName);
		formData.append('phone', `${data.countryCode}${data.phone}`);

		const res = await signup(formData);

		if (typeof res === 'string' && res.includes('Error')) {
			setServerError('Registration failed. This email may already be in use.');
		}
	};

	return (
		<main className="container py-8 md:py-12">
			<div className="max-w-[520px] mx-auto px-4">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Create an account
					</h1>
					<p className="text-gray-500 text-sm">
						Join Maretinda and start shopping today
					</p>
				</div>

				<div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-7">
					{/* Server Error */}
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

					<form noValidate onSubmit={handleSubmit(submit)}>
						<div className="flex flex-col gap-4">
							{/* First + Last Name */}
							<div className="grid grid-cols-2 gap-3">
								<LabeledInput
									autoComplete="given-name"
									disabled={isLoading}
									error={errors.firstName as FieldError}
									important
									inputClassName="border border-gray-300 bg-white rounded-lg h-11 px-3 w-full text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									label="First name"
									labelClassName="text-sm font-medium text-gray-700"
									placeholder="John"
									{...register('firstName')}
								/>
								<LabeledInput
									autoComplete="family-name"
									disabled={isLoading}
									error={errors.lastName as FieldError}
									important
									inputClassName="border border-gray-300 bg-white rounded-lg h-11 px-3 w-full text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									label="Last name"
									labelClassName="text-sm font-medium text-gray-700"
									placeholder="Doe"
									{...register('lastName')}
								/>
							</div>

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

							{/* Phone */}
							<div className="flex flex-col gap-1">
								<p className="text-sm font-medium text-gray-700">
									Phone number{' '}
									<span className="text-red-500/50">*</span>
								</p>
								<div className="flex gap-2">
									<select
										className={`h-11 rounded-lg border ${errors.countryCode ? 'border-red-400' : 'border-gray-300'} bg-white px-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-[110px] flex-shrink-0`}
										disabled={isLoading}
										{...register('countryCode')}
									>
										<option value="">Code</option>
										{COUNTRY_CODES.map((c) => (
											<option key={c.code} value={c.code}>
												{c.label}
											</option>
										))}
									</select>
									<input
										autoComplete="tel"
										className={`flex-1 h-11 rounded-lg border ${errors.phone ? 'border-red-400' : 'border-gray-300'} bg-white px-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
										disabled={isLoading}
										placeholder="9123456789"
										type="tel"
										{...register('phone')}
									/>
								</div>
								{(errors.countryCode || errors.phone) && (
									<p className="text-xs text-red-500 mt-0.5">
										{(errors.countryCode?.message as string) ||
											(errors.phone?.message as string)}
									</p>
								)}
							</div>

							{/* Password */}
							<div className="flex flex-col gap-1">
								<p className="text-sm font-medium text-gray-700">
									Password{' '}
									<span className="text-red-500/50">*</span>
								</p>
								<div className="relative">
									<input
										autoComplete="new-password"
										className={`w-full border ${errors.password ? 'border-red-400' : 'border-gray-300'} bg-white rounded-lg h-11 px-3 pr-10 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
										disabled={isLoading}
										placeholder="Create a strong password"
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

								{/* Password strength hints */}
								{showStrength && (
									<div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 px-0.5">
										<StrengthHint
											label="8+ chars"
											met={!passwordStrength.errors.tooShort}
										/>
										<StrengthHint
											label="Uppercase"
											met={!passwordStrength.errors.noUpper}
										/>
										<StrengthHint
											label="Lowercase"
											met={!passwordStrength.errors.noLower}
										/>
										<StrengthHint
											label="Symbol or digit"
											met={
												!passwordStrength.errors
													.noDigitOrSymbol
											}
										/>
									</div>
								)}

								{errors.password && (
									<p className="text-xs text-red-500 mt-0.5">
										{(errors.password as FieldError).message}
									</p>
								)}
							</div>

							{/* Terms */}
							<div className="flex flex-col gap-1">
								<label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer w-fit">
									<span className="relative flex-shrink-0 mt-0.5">
										<span
											className={`flex items-center justify-center w-5 h-5 rounded border transition-colors ${termsChecked ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-300'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
										I agree to the{' '}
										<Link
											className="text-gray-900 font-medium hover:underline"
											href="/terms"
										>
											Terms & Conditions
										</Link>{' '}
										and{' '}
										<Link
											className="text-gray-900 font-medium hover:underline"
											href="/privacy"
										>
											Privacy Policy
										</Link>
									</span>
								</label>
								{errors.terms && (
									<p className="text-xs text-red-500 ml-7">
										{errors.terms.message as string}
									</p>
								)}
							</div>

							{/* Submit */}
							<button
								className="w-full h-11 rounded-lg bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center mt-1"
								disabled={isLoading}
								type="submit"
							>
								{isSubmitting ? (
									<Spinner color="white" size={18} />
								) : (
									'Create account'
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

					{/* Social */}
					<div className="flex flex-col gap-3">
						<button
							className="flex items-center justify-center w-full h-11 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed gap-2"
							disabled={isLoading}
							onClick={handleGoogleSignup}
							type="button"
						>
							{isGoogleLoading ? (
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

					{/* Login link */}
					<p className="mt-6 text-center text-sm text-gray-500">
						Already have an account?{' '}
						<Link
							className="font-medium text-gray-900 hover:underline"
							href="/login"
						>
							Sign in
						</Link>
					</p>
				</div>
			</div>
		</main>
	);
};
