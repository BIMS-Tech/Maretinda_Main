'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { HttpTypes } from '@medusajs/types';
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
import { updateCustomer } from '@/lib/data/customer';

import { type ProfileDetailsFormData, profileDetailsSchema } from './schema';

interface Props {
	defaultValues?: ProfileDetailsFormData;
	handleClose?: () => void;
}

export const ProfileDetailsForm: React.FC<Props> = ({
	defaultValues,
	...props
}) => {
	const methods = useForm<ProfileDetailsFormData>({
		defaultValues: defaultValues || {
			email: '',
			firstName: '',
			lastName: '',
			phone: '',
		},
		resolver: zodResolver(profileDetailsSchema),
	});

	return (
		<FormProvider {...methods}>
			<Form {...props} />
		</FormProvider>
	);
};

const Form: React.FC<Props> = ({ handleClose }) => {
	const [error, setError] = useState<string>();
	const {
		handleSubmit,
		register,
		formState: { errors },
	} = useFormContext();

	const submit = async (data: FieldValues) => {
		const body = {
			first_name: data.firstName,
			last_name: data.lastName,
			phone: data.phone,
		};
		try {
			await updateCustomer(body as HttpTypes.StoreUpdateCustomer);
		} catch (err) {
			setError((err as Error).message);
			return;
		}

		setError('');
		handleClose && handleClose();
	};

	return (
		<form onSubmit={handleSubmit(submit)}>
			<div className="px-4 space-y-4">
				<div className="max-w-full grid grid-cols-2 items-top gap-4 mb-4">
					<LabeledInput
						error={errors.firstName as FieldError}
						label="First name"
						placeholder="Type first name"
						{...register('firstName')}
					/>
					<LabeledInput
						error={errors.lastName as FieldError}
						label="Last name"
						placeholder="Type last name"
						{...register('lastName')}
					/>
					<LabeledInput
						error={errors.phone as FieldError}
						label="Phone"
						placeholder="Type phone number"
						{...register('phone')}
					/>
					<LabeledInput
						disabled
						label="Email"
						{...register('email')}
					/>
				</div>
				{error && <p className="label-md text-negative">{error}</p>}
				<Button className="w-full ">Save</Button>
			</div>
		</form>
	);
};
