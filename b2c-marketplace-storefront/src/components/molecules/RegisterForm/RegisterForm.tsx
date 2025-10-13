'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Container } from '@medusajs/ui';
import Link from 'next/link';
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
import { PasswordValidator } from '@/components/cells/PasswordValidator/PasswordValidator';
import { signup } from '@/lib/data/customer';

import { type RegisterFormData, registerFormSchema } from './schema';

export const RegisterForm = () => {
	const methods = useForm<RegisterFormData>({
		defaultValues: {
			email: '',
			firstName: '',
			lastName: '',
			password: '',
			phone: '',
		},
		resolver: zodResolver(registerFormSchema),
	});

	return (
		<FormProvider {...methods}>
			<Form />
		</FormProvider>
	);
};

const Form = () => {
	const [passwordError, setPasswordError] = useState({
		'8chars': false,
		isValid: false,
		lower: false,
		symbolOrDigit: false,
		upper: false,
	});
	const [error, setError] = useState();
	const {
		handleSubmit,
		register,
		watch,
		formState: { errors, isSubmitting },
	} = useFormContext();

	const submit = async (data: FieldValues) => {
		const formData = new FormData();
		formData.append('email', data.email);
		formData.append('password', data.password);
		formData.append('first_name', data.firstName);
		formData.append('last_name', data.lastName);
		formData.append('phone', data.phone);

		const res = passwordError.isValid && (await signup(formData));

		if (res && !res?.id) setError(res);
	};

	return (
		<main className="container">
			<Container className="border max-w-xl mx-auto mt-8 p-4">
				<h1 className="heading-md text-primary uppercase mb-8">
					Create account
				</h1>
				<form onSubmit={handleSubmit(submit)}>
					<div className="flex flex-col md:flex-row gap-4 mb-4">
						<LabeledInput
							className="md:w-1/2"
							error={errors.firstName as FieldError}
							label="First name"
							placeholder="Your first name"
							{...register('firstName')}
						/>
						<LabeledInput
							className="md:w-1/2"
							error={errors.lastName as FieldError}
							label="Last name"
							placeholder="Your last name"
							{...register('lastName')}
						/>
					</div>
					<div className="flex flex-col md:flex-row gap-4 mb-4">
						<LabeledInput
							className="md:w-1/2"
							error={errors.email as FieldError}
							label="E-mail"
							placeholder="Your e-mail address"
							{...register('email')}
						/>
						<LabeledInput
							className="md:w-1/2"
							error={errors.phone as FieldError}
							label="Phone"
							placeholder="Your phone number"
							{...register('phone')}
						/>
					</div>
					<div>
						<LabeledInput
							className="mb-4"
							error={errors.password as FieldError}
							label="Password"
							placeholder="Your password"
							type="password"
							{...register('password')}
						/>
						<PasswordValidator
							password={watch('password')}
							setError={setPasswordError}
						/>
					</div>

					{error && <p className="label-md text-negative">{error}</p>}
					<Button
						className="w-full flex justify-center mt-8 uppercase"
						disabled={isSubmitting}
						loading={isSubmitting}
					>
						Create account
					</Button>
				</form>
			</Container>
			<Container className="border max-w-xl mx-auto mt-8 p-4">
				<h1 className="heading-md text-primary uppercase mb-8">
					Already have an account?
				</h1>
				<p className="text-center label-md">
					<Link href="/user">
						<Button
							className="w-full flex justify-center mt-8 uppercase"
							variant="tonal"
						>
							Log in
						</Button>
					</Link>
				</p>
			</Container>
		</main>
	);
};
