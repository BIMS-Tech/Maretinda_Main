'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle } from '@medusajs/icons';
import { HttpTypes } from '@medusajs/types';
import { Heading, toast } from '@medusajs/ui';
import { useEffect, useState } from 'react';
import {
	type FieldError,
	type FieldValues,
	FormProvider,
	type UseFormReturn,
	useForm,
	useFormContext,
} from 'react-hook-form';

import { Button, Card } from '@/components/atoms';
import { LabeledInput } from '@/components/cells';
import { updateCustomerPassword } from '@/lib/data/customer';
import { cn } from '@/lib/utils';

import LocalizedClientLink from '../LocalizedLink/LocalizedLink';
import { type ProfilePasswordFormData, profilePasswordSchema } from './schema';

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

export const ProfilePasswordForm = ({ token }: { token?: string }) => {
	const form = useForm<ProfilePasswordFormData>({
		defaultValues: {
			confirmPassword: '',
			currentPassword: '',
			newPassword: '',
		},
		resolver: zodResolver(profilePasswordSchema),
	});

	return (
		<FormProvider {...form}>
			<Form form={form} token={token} />
		</FormProvider>
	);
};

const Form = ({
	form,
	token,
}: {
	form: UseFormReturn<ProfilePasswordFormData>;
	token?: string;
}) => {
	const [success, setSuccess] = useState(false);
	const [confirmPasswordError, setConfirmPasswordError] = useState<
		FieldError | undefined
	>(undefined);
	const [newPasswordError, setNewPasswordError] = useState({
		'8chars': false,
		isValid: false,
		lower: false,
		symbolOrDigit: false,
		upper: false,
	});

	useEffect(() => {
		const password = form.getValues('newPassword');
		const validation = validatePassword(password);

		setNewPasswordError({
			'8chars': validation.errors.tooShort,
			isValid: validation.isValid,
			lower: validation.errors.noLower,
			symbolOrDigit: validation.errors.noDigitOrSymbol,
			upper: validation.errors.noUpper,
		});
	}, [form.watch('newPassword')]);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useFormContext();

	const updatePassword = async (data: FieldValues) => {
		if (
			form.getValues('confirmPassword') !== form.getValues('newPassword')
		) {
			setConfirmPasswordError({
				message: 'New password and old password cannot be identical',
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
					toast.success('Password updated');
					setSuccess(true);
				} else {
					toast.error(res.error || 'Something went wrong');
				}
			} catch (err) {
				console.log(err);
				return;
			}
		}
	};

	return success ? (
		<div className="p-4">
			<Heading
				className="uppercase heading-md text-primary text-center"
				level="h1"
			>
				Password updated
			</Heading>
			<p className="text-center my-8">
				Your password has been updated. You can now login with your new
				password.
			</p>
			<LocalizedClientLink href="/user">
				<Button
					className="uppercase py-3 px-6 !font-semibold w-full"
					size="large"
				>
					Go to user page
				</Button>
			</LocalizedClientLink>
		</div>
	) : (
		<form
			className="flex flex-col gap-4 px-4"
			onSubmit={handleSubmit(updatePassword)}
		>
			<LabeledInput
				error={errors.currentPassword as FieldError}
				label="Current password"
				type="password"
				{...register('currentPassword')}
			/>
			<LabeledInput
				error={errors.newPassword as FieldError}
				label="New password"
				type="password"
				{...register('newPassword')}
			/>
			<Card className="p-4">
				<p
					className={cn(
						'label-md flex items-center gap-2 mb-2',
						newPasswordError['8chars']
							? 'text-red-700'
							: 'text-green-700',
					)}
				>
					<CheckCircle /> At least 8 characters
				</p>
				<p
					className={cn(
						'label-md flex items-center gap-2 mb-2',
						newPasswordError['lower']
							? 'text-red-700'
							: 'text-green-700',
					)}
				>
					<CheckCircle /> One lowercase letter
				</p>
				<p
					className={cn(
						'label-md flex items-center gap-2 mb-2',
						newPasswordError['upper']
							? 'text-red-700'
							: 'text-green-700',
					)}
				>
					<CheckCircle /> One uppercase letter
				</p>
				<p
					className={cn(
						'label-md flex items-center gap-2 mb-2',
						newPasswordError['symbolOrDigit']
							? 'text-red-700'
							: 'text-green-700',
					)}
				>
					<CheckCircle /> One number or symbol
				</p>
			</Card>
			<LabeledInput
				error={confirmPasswordError as FieldError}
				label="Confirm new password"
				type="password"
				{...register('confirmPassword')}
			/>
			<Button className="w-full my-4">Change password</Button>
		</form>
	);
};
