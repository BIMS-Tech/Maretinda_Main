'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Container, Divider } from '@medusajs/ui';
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

import { Button, Checkbox } from '@/components/atoms';
import { LabeledInput } from '@/components/cells';
import { FacebookColorIcon, GoogleIcon } from '@/icons';
import { login } from '@/lib/data/customer';

import { type LoginFormData, loginFormSchema } from './schema';

export const LoginForm = () => {
	const methods = useForm<LoginFormData>({
		defaultValues: {
			email: '',
			password: '',
			remember: false,
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
	const {
		handleSubmit,
		register,
		watch,
		formState: { errors },
	} = useFormContext();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [resError, setResError] = useState<string | null>('');
	const [isResError, setIsResError] = useState(false);
	const [isRedirecting, setIsRedirecting] = useState(false);
	const [loginButton, setLoginButton] = useState(false);
	const [googleButton, setGoogleButton] = useState(false);
	const [facebookButton, setFacebookButton] = useState(false);

	const submit = async (data: FieldValues) => {
		setIsRedirecting(true);
		const formData = new FormData();
		formData.append('email', data.email);
		formData.append('password', data.password);

		const res = await login(formData);

		if (typeof res === 'string' && res.includes('Error')) {
			setIsRedirecting(false);
			setLoginButton(false);
			setGoogleButton(false);
			setFacebookButton(false);
			setResError(res);
			setIsResError(true);
			return;
		}

		const returnTo = searchParams.get('returnTo');
		router.push(returnTo || '/user');
		setLoginButton(false);
		setGoogleButton(false);
		setFacebookButton(false);
		setIsRedirecting(false);
	};

	return (
		<main className="container">
			<Container className="border max-w-[793px] mx-auto mt-8 p-8">
				<div className="text-center mb-8">
					<h1 className="heading-xl text-4xl text-primary">
						Welcome Back!
					</h1>
					<p className="mt-5 text-base font-normal">
						Enter your details below
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
						<LabeledInput
							error={errors.password as FieldError}
							important
							inputClassName="border border-black bg-white"
							label="Password"
							labelClassName="text-black/50 font-normal text-sm md:text-base"
							type="password"
							{...register('password')}
						/>
						<div className="flex flex-row justify-between">
							<Checkbox
								checked={watch('remember')}
								className="mb-4 rounded-none"
								label="Remember me"
								labelClassName="items-start text-sm md:text-base font-medium text-black/69 justify-normal w-fit"
								{...register('remember')}
							/>

							<div>
								<Link
									className="text-right text-sm md:text-base text-black/69 font-medium underline"
									href="/forgot-password"
								>
									Forgot Password?
								</Link>
							</div>
						</div>
						{isResError && (
							<Alert
								className="flex items-center justify-between w-full"
								dismissible={true}
								onClick={() => {
									setIsResError(false);
								}}
								variant="error"
							>
								{resError}
							</Alert>
						)}
						<Button
							className="w-full !h-12 md:!h-16 flex justify-center my-4 md:my-8 py-3 px-1 md:py-4 md:px-2 bg-black hover:bg-black text-base md:text-xl text-white"
							disabled={loginButton && isRedirecting}
							loading={!loginButton && isRedirecting}
							onClick={() => {
								setGoogleButton(true);
								setFacebookButton(true);
								console.log(googleButton, facebookButton);
							}}
							variant="text"
						>
							Log In
						</Button>

						<div className="flex items-center mt-8">
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
								disabled={googleButton && isRedirecting}
								loading={!googleButton && isRedirecting}
								onClick={() => {
									setLoginButton(true);
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
								disabled={facebookButton && isRedirecting}
								loading={!facebookButton && isRedirecting}
								onClick={() => {
									setLoginButton(true);
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
							Don&apos;t have an account yet?{' '}
							<Link className="underline" href="/register">
								Sign up
							</Link>
						</div>
					</div>
				</form>
			</Container>
		</main>
	);
};
