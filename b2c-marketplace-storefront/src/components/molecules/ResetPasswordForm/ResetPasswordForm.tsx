'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Container, Divider, toast } from '@medusajs/ui';
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

import { Button } from '@/components/atoms';
import { LabeledInput } from '@/components/cells';
import { updateCustomerPassword } from '@/lib/data/customer';

import { type ResetPasswordFormData, resetPasswordSchema } from './schema';

function validatePassword(password: string) {
	const errors = {
		noDigitOrSymbol: !/[0-9!@#$%^&*(),.?":{}|<>_\-+=[\]\\/~`]/.test(
			password,
		),
		noLower: !/[a-z]/.test(password),
		noUpper: !/[A-Z]/.test(password),
		tooShort: password.length < 8,
	};

	return {
		errors,
		isValid: !Object.values(errors).some(Boolean),
	};
}

export const ResetPasswordForm = ({ token }: { token?: string }) => {
	const methods = useForm<ResetPasswordFormData>({
		defaultValues: {
			confirmPassword: '',
			newPassword: '',
		},
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
	const [confirmPasswordError, setConfirmPasswordError] = useState<
		FieldError | undefined
	>(undefined);
	const [isSuccess, setIsSuccess] = useState(false);
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
		if (
			form.getValues('confirmPassword') !== form.getValues('newPassword')
		) {
			setConfirmPasswordError({
				message: 'Passwords do not match',
				type: 'custom',
			} as FieldError);
			return;
		}

		setConfirmPasswordError(undefined);

		if (newPasswordError.isValid) {
			try {
				const res = await updateCustomerPassword(
					data.newPassword,
					token!,
				);
				if (res.success) {
					form.reset();

					setIsSuccess(true);

					setTimeout(() => {
						const returnTo = searchParams.get('returnTo');
						router.push(returnTo || '/login');
					}, 5000);
				} else {
					toast.error(res.error || 'Something went wrong');
				}
			} catch (err) {
				return;
			}
		}
	};

	return (
		<main className="container">
			<Container className="border max-w-[793px] mx-auto p-8">
				<div className="text-center mb-8 px-1 md:px-2">
					<h1 className="heading-xl text-xl md:text-3xl font-medium text-primary">
						Reset Password
					</h1>
					<Divider className="border-black mt-4" />
					{!isSuccess && (
						<p className="mt-5 text-start text-sm md:text-base font-normal">
							Please enter your new password and retype it to
							complete your password reset.
						</p>
					)}
				</div>
				{!isSuccess ? (
					<form onSubmit={handleSubmit(updatePassword)}>
						<div className="flex flex-col w-full gap-1 md:gap-4 max-w-full mx-auto px-1 md:px-2 space-y-4">
							<LabeledInput
								error={errors.newPassword as FieldError}
								important
								inputClassName="border border-black bg-white"
								label="New Password"
								labelClassName="text-black/50 font-normal text-sm md:text-base"
								type="password"
								{...register('newPassword')}
							/>
							<LabeledInput
								error={confirmPasswordError as FieldError}
								important
								inputClassName="border border-black bg-white"
								label="Confirm New Password"
								labelClassName="text-black/50 font-normal text-sm md:text-base"
								type="password"
								{...register('confirmPassword')}
							/>

							<Button
								className="w-full !h-12 md:!h-16 flex justify-center my-4 md:my-8 py-3 px-1 md:py-4 md:px-2 bg-black hover:bg-black text-base md:text-lg text-white"
								disabled={isSubmitting}
								loading={isSubmitting}
								variant="text"
							>
								Reset Password
							</Button>
						</div>
					</form>
				) : (
					<Alert variant="success">
						Password updated! Redirecting to login page...
					</Alert>
				)}
			</Container>
		</main>
	);
};
