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
		handleClose?.();
	};

	return (
		<form onSubmit={handleSubmit(submit)}>
			<div className="space-y-4">
				<div className="max-w-full grid grid-cols-2 items-top gap-3 mb-8">
					<LabeledInput
						error={errors.firstName as FieldError}
						important
						inputClassName="text-[13px]"
						label="First name"
						labelClassName="text-[14px]"
						placeholder="Type first name"
						{...register('firstName')}
					/>
					<LabeledInput
						error={errors.lastName as FieldError}
						important
						inputClassName="text-[13px]"
						label="Last name"
						labelClassName="text-[14px]"
						placeholder="Type last name"
						{...register('lastName')}
					/>
					<LabeledInput
						error={errors.phone as FieldError}
						important
						inputClassName="text-[13px]"
						label="Phone"
						labelClassName="text-[14px]"
						placeholder="Type phone number"
						{...register('phone')}
					/>
					<LabeledInput
						disabled
						important
						inputClassName="text-[13px]"
						label="Email"
						labelClassName="text-[14px]"
						{...register('email')}
					/>
				</div>
				{error && <p className="label-md text-negative">{error}</p>}
				<div className="flex justify-end gap-2">
					<Button
						className="w-fit px-2 py-1 bg-white !text-[13px] rounded-[6px] border border-black/10 shadow-sm !font-medium"
						onClick={handleClose}
					>
						Cancel
					</Button>
					<Button className="py-1 px-2 rounded-[6px] !text-[13px] leading-[20px] !font-medium">
						Save
					</Button>
				</div>
			</div>
		</form>
	);
};
