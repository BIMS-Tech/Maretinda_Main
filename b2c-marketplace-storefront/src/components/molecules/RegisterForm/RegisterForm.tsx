'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Container, toast } from '@medusajs/ui';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
	type FieldError,
	type FieldValues,
	FormProvider,
	useForm,
	useFormContext,
} from 'react-hook-form';

import { Button, Checkbox, Divider } from '@/components/atoms';
import { LabeledInput } from '@/components/cells';
import { validatePassword } from '@/components/cells/PasswordValidator/PasswordValidator';
import { FacebookColorIcon, GoogleIcon } from '@/icons';
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

const Form = () => {
	const [passwordError, setPasswordError] = useState({
		'8chars': false,
		isValid: false,
		lower: false,
		symbolOrDigit: false,
		upper: false,
	});
	const [resError, setResError] = useState<string>('');
	const [isResError, setIsResError] = useState(false);
	const [registerButton, setRegisterButton] = useState(false);
	const [googleButton, setGoogleButton] = useState(false);
	const [facebookButton, setFacebookButton] = useState(false);

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

		if (passwordError.isValid) {
			toast.error(errors.password?.message as string);
			return;
		}

		const res = await signup(formData);

		if (typeof res === 'string' && res.includes('Error')) {
			setRegisterButton(false);
			setGoogleButton(false);
			setFacebookButton(false);
			setResError(res);
			setIsResError(true);
			return;
		}
	};

	useEffect(() => {
		const password = watch('password');

		const validation = validatePassword(password);

		setPasswordError({
			'8chars': validation.errors.tooShort,
			isValid: validation.isValid,
			lower: validation.errors.noLower,
			symbolOrDigit: validation.errors.noDigitOrSymbol,
			upper: validation.errors.noUpper,
		});
	}, [watch]);

	return (
		<main className="container">
			<Container className="border max-w-[793px] mx-auto mt-8 p-8">
				<div className="text-center mb-8">
					<h1 className="heading-xl text-4xl text-primary">
						Create an Account
					</h1>
					<p className="mt-5 text-base font-normal">
						Enter your details below
					</p>
				</div>
				<form noValidate onSubmit={handleSubmit(submit)}>
					<div className="flex flex-col md:flex-row mx-auto gap-4 mb-4">
						<LabeledInput
							className="md:w-1/2"
							error={errors.firstName as FieldError}
							important
							inputClassName="border border-black bg-white"
							label="First Name"
							labelClassName="text-black/50 font-normal text-sm md:text-base"
							{...register('firstName')}
						/>
						<LabeledInput
							className="md:w-1/2"
							error={errors.lastName as FieldError}
							important
							inputClassName="border border-black bg-white"
							label="Last Name"
							labelClassName="text-black/50 font-normal text-sm md:text-base"
							{...register('lastName')}
						/>
					</div>
					<div className="flex flex-col md:flex-row gap-4 mb-4">
						<LabeledInput
							className="md:w-1/2"
							error={errors.phone as FieldError}
							important
							inputClassName="border border-black bg-white"
							label="Ph Number"
							labelClassName="text-black/50 font-normal text-sm md:text-base"
							{...register('phone')}
						/>
						<LabeledInput
							className="md:w-1/2"
							error={errors.email as FieldError}
							important
							inputClassName="border border-black bg-white"
							label="Email"
							labelClassName="text-black/50 font-normal text-sm md:text-base"
							{...register('email')}
						/>
					</div>
					<div>
						<LabeledInput
							className="mb-4"
							error={errors.password as FieldError}
							important
							inputClassName="border border-black bg-white"
							label="Password"
							labelClassName="text-black/50 font-normal text-sm md:text-base"
							type="password"
							{...register('password')}
						/>
						{/* <PasswordValidator
              password={watch("password")}
              setError={setPasswordError}
            /> */}
					</div>
					<div>
						<Checkbox
							checked={watch('terms')}
							className="mb-4 rounded-none"
							label="Agree to the Terms & Conditions and Privacy Policy"
							labelClassName="items-start text-sm md:text-base font-medium text-black/69 justify-normal w-fit"
							{...register('terms')}
						/>
					</div>
					{errors && (
						<p className="label-md text-negative">
							{errors.terms?.message as string}
						</p>
					)}
					{isResError && (
						<Alert
							className="flex items-center justify-between w-full mt-8"
							dismissible={true}
							onClick={() => setIsResError(false)}
							variant="error"
						>
							{resError}
						</Alert>
					)}
					<Button
						className="w-full !h-12 md:!h-16 flex justify-center mt-4 md:mt-8 py-3 px-1 md:py-4 md:px-2 bg-black hover:bg-black text-base md:text-lg text-white"
						disabled={registerButton && isSubmitting}
						loading={!registerButton && isSubmitting}
						onClick={() => {
							setGoogleButton(true);
							setFacebookButton(true);
							console.log(googleButton, facebookButton);
						}}
						type="submit"
						variant="text"
					>
						Create an Account
					</Button>

					<div className="flex items-center my-4 md:mt-8">
						<div className="flex-grow">
							<Divider className="border-black/37 border-t-2" />
						</div>

						<span className="mx-8 text-base text-black font-medium">
							Or
						</span>

						<div className="flex-grow">
							<Divider className="border-black/37 border-t-2" />
						</div>
					</div>

					<div className="flex flex-col md:flex-row gap-0 md:gap-9">
						<Button
							className="w-full flex items-center justify-center mt-0 md:mt-4 py-2 px-1 md:py-4 md:px-2 hover:bg-white/0 border-black border text-base md:text-lg font-light md:font-normal text-black"
							disabled={googleButton && isSubmitting}
							loading={!googleButton && isSubmitting}
							onClick={() => {
								setRegisterButton(true);
								setFacebookButton(true);
							}}
							variant="text"
						>
							<span>
								<GoogleIcon className="sm:mr-0.5 mr-2" />
							</span>
							Sign in with Google
						</Button>

						<Button
							className="w-full flex items-center justify-center mt-4 py-2 px-1 md:py-4 md:px-2 hover:bg-white/0 border-black border text-base md:text-lg font-light md:font-normal text-black"
							disabled={facebookButton && isSubmitting}
							loading={!facebookButton && isSubmitting}
							onClick={() => {
								setRegisterButton(true);
								setGoogleButton(true);
							}}
							variant="text"
						>
							<span>
								<FacebookColorIcon className="sm:mr-0.5 mr-2" />
							</span>
							Sign in with Facebook
						</Button>
					</div>

					<div className="mt-4 md:mt-8 text-center text-base md:text-lg font-thin md:font-normal">
						Already have an account?{' '}
						<Link className="underline" href="/login">
							Log in
						</Link>
					</div>
				</form>
			</Container>
		</main>
	);
};
