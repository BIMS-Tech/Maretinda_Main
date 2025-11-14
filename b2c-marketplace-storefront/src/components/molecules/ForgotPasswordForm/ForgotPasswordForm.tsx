'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Container, Divider } from '@medusajs/ui';
import { useState } from 'react';
import {
	type FieldError,
	type FieldValues,
	FormProvider,
	useForm,
	useFormContext,
} from 'react-hook-form';

import { Button } from '@/components/atoms';
import { LabeledInput } from '@/components/cells';
import { sendResetPasswordEmail } from '@/lib/data/customer';

import {
	type ForgotPasswordFormData,
	forgotPasswordFormSchema,
} from './schema';

export const ForgotPasswordForm = () => {
	const methods = useForm<ForgotPasswordFormData>({
		defaultValues: {
			email: '',
		},
		resolver: zodResolver(forgotPasswordFormSchema),
	});

	return (
		<FormProvider {...methods}>
			<Form />
		</FormProvider>
	);
};

const Form = () => {
	const [error, setError] = useState('');
	const [isSuccess, setIsSuccess] = useState(false);

	const {
		formState: { errors, isSubmitting },
		handleSubmit,
		register,
		reset,
	} = useFormContext();

	const submit = async (data: FieldValues) => {
		const formData = new FormData();
		formData.append('email', data.email);

		const res = await sendResetPasswordEmail(data.email);

		if (res.error) {
			setError(res.error);

			return;
		}

		setError('');
		setIsSuccess(true);
		reset();
	};

	return (
		<main className="container">
			<Container className="border max-w-[793px] mx-auto p-8">
				<div className="text-center mb-8 px-1 md:px-2">
					<h1 className="heading-xl text-xl md:text-3xl font-medium text-primary">
						Forgot Password?
					</h1>
					<Divider className="border-black mt-4" />
					<p className="mt-5 text-start text-sm md:text-base font-normal">
						Please enter your email address. You will receive a link
						to create a new password via email.
					</p>
				</div>
				<form onSubmit={handleSubmit(submit)}>
					<div className="flex flex-col w-full gap-1 md:gap-4 max-w-full mx-auto px-1 md:px-2 space-y-4">
						<LabeledInput
							error={errors.email as FieldError}
							important
							inputClassName="border border-black bg-white"
							label="E-mail"
							labelClassName="text-black/50 font-normal text-sm md:text-base"
							{...register('email')}
						/>
						{error && <Alert variant="error">{error}</Alert>}
						{isSuccess && (
							<Alert variant="success">
								If an account with that email address exists,
								you will receive an email with instructions to
								reset your password. Please check your inbox and
								spam folder.
							</Alert>
						)}
						<Button
							className="w-full !h-12 md:!h-16 flex justify-center my-4 md:my-8 py-3 px-1 md:py-4 md:px-2 bg-black hover:bg-black text-base md:text-lg text-white"
							disabled={isSubmitting}
							loading={isSubmitting}
							variant="text"
						>
							Send Email
						</Button>
					</div>
				</form>
			</Container>
		</main>
	);
};
