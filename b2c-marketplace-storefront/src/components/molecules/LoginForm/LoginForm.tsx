'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
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
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { login } from '@/lib/data/customer';

import { type LoginFormData, loginFormSchema } from './schema';

export const LoginForm = () => {
	const methods = useForm<LoginFormData>({
		defaultValues: {
			email: '',
			password: '',
		},
		resolver: zodResolver(loginFormSchema),
	});

	return (
		<FormProvider {...methods}>
			<Form />
		</FormProvider>
	);
};

const Form = () => {
	const [error, setError] = useState('');
	const {
		handleSubmit,
		register,
		formState: { errors, isSubmitting },
	} = useFormContext();
	const router = useRouter();
	const searchParams = useSearchParams();

	const submit = async (data: FieldValues) => {
		const formData = new FormData();
		formData.append('email', data.email);
		formData.append('password', data.password);

		const res = await login(formData);
		if (res) {
			setError(res);
			return;
		}
		setError('');

		// Redirect to returnTo URL if provided, otherwise go to user page
		const returnTo = searchParams.get('returnTo');
		router.push(returnTo || '/user');
	};

	return (
		<main className="container">
			<h1 className="heading-xl text-center uppercase my-6">
				Log in to your account
			</h1>
			<form onSubmit={handleSubmit(submit)}>
				<div className="w-96 max-w-full mx-auto space-y-4">
					<LabeledInput
						error={errors.email as FieldError}
						label="E-mail"
						placeholder="Your e-mail address"
						{...register('email')}
					/>
					<LabeledInput
						error={errors.password as FieldError}
						label="Password"
						placeholder="Your password"
						type="password"
						{...register('password')}
					/>
					{error && <p className="label-md text-negative">{error}</p>}
					<Button className="w-full" disabled={isSubmitting}>
						Log in
					</Button>
					<p className="text-center label-md">
						Don&apos;t have an account yet?{' '}
						<LocalizedClientLink
							className="underline"
							href="/user/register"
						>
							Sign up!
						</LocalizedClientLink>
					</p>
				</div>
			</form>
		</main>
	);
};
