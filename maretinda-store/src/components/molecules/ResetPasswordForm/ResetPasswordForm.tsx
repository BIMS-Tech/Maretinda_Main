'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@medusajs/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
	type FieldError,
	type FieldValues,
	FormProvider,
	type UseFormReturn,
	useForm,
	useFormContext,
} from 'react-hook-form';

import { HideIcon } from '@/icons';
import Spinner from '@/icons/spinner';
import { updateCustomerPassword } from '@/lib/data/customer';

import { type ResetPasswordFormData, resetPasswordSchema } from './schema';

function validatePassword(password: string) {
	const errors = {
		noDigitOrSymbol: !/[0-9!@#$%^&*(),.?":{}|<>_\-+=[\]\\/~`]/.test(password),
		noLower: !/[a-z]/.test(password),
		noUpper: !/[A-Z]/.test(password),
		tooShort: password.length < 8,
	};
	return { errors, isValid: !Object.values(errors).some(Boolean) };
}

const INPUT_CLASS =
	'border bg-white rounded-xl h-11 px-3.5 w-full text-[13.5px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:border-[#432C63] focus:ring-2 focus:ring-[#432C63]/10';

const EyeIcon = () => (
	<svg fill="none" height={18} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" width={18}>
		<path
			d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

export const ResetPasswordForm = ({ token }: { token?: string }) => {
	const methods = useForm<ResetPasswordFormData>({
		defaultValues: { confirmPassword: '', newPassword: '' },
		resolver: zodResolver(resetPasswordSchema),
	});

	return (
		<FormProvider {...methods}>
			<Form form={methods} token={token} />
		</FormProvider>
	);
};

const Form = ({
	form,
	token,
}: {
	form: UseFormReturn<ResetPasswordFormData>;
	token?: string;
}) => {
	const [confirmPasswordError, setConfirmPasswordError] = useState<FieldError | undefined>(undefined);
	const [isSuccess, setIsSuccess] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [newPasswordError, setNewPasswordError] = useState({
		'8chars': false,
		isValid: false,
		lower: false,
		symbolOrDigit: false,
		upper: false,
	});

	const password = form.watch('newPassword');

	useEffect(() => {
		const validation = validatePassword(password);
		setNewPasswordError({
			'8chars': validation.errors.tooShort,
			isValid: validation.isValid,
			lower: validation.errors.noLower,
			symbolOrDigit: validation.errors.noDigitOrSymbol,
			upper: validation.errors.noUpper,
		});
	}, [password]);

	const {
		handleSubmit,
		register,
		formState: { errors, isSubmitting },
	} = useFormContext();

	const router = useRouter();
	const searchParams = useSearchParams();

	const updatePassword = async (data: FieldValues) => {
		if (form.getValues('confirmPassword') !== form.getValues('newPassword')) {
			setConfirmPasswordError({ message: 'Passwords do not match', type: 'custom' } as FieldError);
			return;
		}
		setConfirmPasswordError(undefined);

		if (newPasswordError.isValid) {
			try {
				const res = await updateCustomerPassword(data.newPassword, token!);
				if (res.success) {
					form.reset();
					setIsSuccess(true);
					setTimeout(() => {
						const returnTo = searchParams.get('returnTo');
						router.push(returnTo || '/login');
					}, 5000);
				}
			} catch {
				return;
			}
		}
	};

	return (
		<main className="min-h-[60vh] py-10 md:py-16" style={{ backgroundColor: '#FAF8F5' }}>
			<div className="max-w-[440px] mx-auto px-4">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="font-serif text-[32px] tracking-[-0.01em] text-[#1B1B1B] mb-1.5">
						Reset Password
					</h1>
					{!isSuccess && (
						<p className="text-[13.5px]" style={{ color: '#737373' }}>
							Enter your new password below to complete the reset.
						</p>
					)}
				</div>

				<div className="bg-white rounded-2xl shadow-sm p-7" style={{ border: '1px solid #EDEAE3' }}>
					{isSuccess ? (
						<Alert variant="success">
							Password updated! Redirecting to login page...
						</Alert>
					) : (
						<form noValidate onSubmit={handleSubmit(updatePassword)}>
							<div className="flex flex-col gap-4">
								{/* New Password */}
								<div className="flex flex-col gap-1">
									<p className="text-[13px] font-semibold text-[#1B1B1B]">
										New Password <span className="text-red-400">*</span>
									</p>
									<div className="relative">
										<input
											className={`${INPUT_CLASS} pr-10 ${errors.newPassword ? 'border-red-400' : 'border-[#EDEAE3]'}`}
											disabled={isSubmitting}
											placeholder="••••••••"
											type={showNewPassword ? 'text' : 'password'}
											{...register('newPassword')}
										/>
										<button
											className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
											style={{ color: '#9B9B9B' }}
											onClick={() => setShowNewPassword((v) => !v)}
											tabIndex={-1}
											type="button"
										>
											{showNewPassword ? <HideIcon color="#9B9B9B" size={18} /> : <EyeIcon />}
										</button>
									</div>
									{errors.newPassword && (
										<p className="text-[11.5px] text-red-500 mt-0.5">
											{(errors.newPassword as FieldError).message}
										</p>
									)}
								</div>

								{/* Confirm Password */}
								<div className="flex flex-col gap-1">
									<p className="text-[13px] font-semibold text-[#1B1B1B]">
										Confirm New Password <span className="text-red-400">*</span>
									</p>
									<div className="relative">
										<input
											className={`${INPUT_CLASS} pr-10 ${confirmPasswordError ? 'border-red-400' : 'border-[#EDEAE3]'}`}
											disabled={isSubmitting}
											placeholder="••••••••"
											type={showConfirmPassword ? 'text' : 'password'}
											{...register('confirmPassword')}
										/>
										<button
											className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
											style={{ color: '#9B9B9B' }}
											onClick={() => setShowConfirmPassword((v) => !v)}
											tabIndex={-1}
											type="button"
										>
											{showConfirmPassword ? <HideIcon color="#9B9B9B" size={18} /> : <EyeIcon />}
										</button>
									</div>
									{confirmPasswordError && (
										<p className="text-[11.5px] text-red-500 mt-0.5">
											{confirmPasswordError.message}
										</p>
									)}
								</div>

								{/* Password strength hint */}
								{password.length > 0 && !newPasswordError.isValid && (
									<p className="text-[11.5px] text-amber-600">
										Password must be at least 8 characters with uppercase, lowercase, and a number or symbol.
									</p>
								)}

								<button
									className="w-full h-11 rounded-full text-[13.5px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center mt-1"
									style={{ backgroundColor: '#432C63' }}
									disabled={isSubmitting}
									type="submit"
								>
									{isSubmitting ? <Spinner color="white" size={18} /> : 'Reset Password'}
								</button>
							</div>
						</form>
					)}
				</div>
			</div>
		</main>
	);
};
