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
import CountrySelect from '@/components/cells/CountrySelect/CountrySelect';
import { addCustomerAddress, updateCustomerAddress } from '@/lib/data/customer';

import { type AddressFormData, addressSchema } from './schema';

interface Props {
	defaultValues?: AddressFormData;

	regions: HttpTypes.StoreRegion[];
	handleClose?: () => void;
}

export const emptyDefaultAddressValues = {
	address: '',
	addressName: '',
	city: '',
	company: '',
	countryCode: '',
	firstName: '',
	lastName: '',
	metadata: {},
	phone: '',
	postalCode: '',
	province: '',
};

export const AddressForm: React.FC<Props> = ({ defaultValues, ...props }) => {
	const methods = useForm<AddressFormData>({
		defaultValues: defaultValues || emptyDefaultAddressValues,
		resolver: zodResolver(addressSchema),
	});

	return (
		<FormProvider {...methods}>
			<Form {...props} />
		</FormProvider>
	);
};

const Form: React.FC<Props> = ({ regions, handleClose }) => {
	const [error, setError] = useState<string>();
	const {
		handleSubmit,
		register,
		formState: { errors },
		watch,
	} = useFormContext();

	const region = {
		countries: regions.flatMap((region) => region.countries),
	};

	const submit = async (data: FieldValues) => {
		const formData = new FormData();
		formData.append('addressId', data.addressId || '');
		formData.append('address_name', data.addressName);
		formData.append('first_name', data.firstName);
		formData.append('last_name', data.lastName);
		formData.append('address_1', data.address);
		formData.append('address_2', '');
		formData.append('province', data.province);
		formData.append('city', data.city);
		formData.append('country_code', data.countryCode);
		formData.append('postal_code', data.postalCode);
		formData.append('company', data.company);
		formData.append('phone', data.phone);

		const res = data.addressId
			? await updateCustomerAddress(formData)
			: await addCustomerAddress(formData);

		if (!res.success) {
			setError(res.error);
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
						className="col-span-2"
						error={errors.firstName as FieldError}
						label="Address name"
						placeholder="Type address name"
						{...register('addressName')}
					/>
					<LabeledInput
						error={errors.firstName as FieldError}
						label="First name"
						placeholder="Type first name"
						{...register('firstName')}
					/>
					<LabeledInput
						error={errors.firstName as FieldError}
						label="Last name"
						placeholder="Type last name"
						{...register('lastName')}
					/>
					<LabeledInput
						error={errors.company as FieldError}
						label="Company (optional)"
						placeholder="Type company"
						{...register('company')}
					/>
					<LabeledInput
						error={errors.address as FieldError}
						label="Address"
						placeholder="Type address"
						{...register('address')}
					/>
					<LabeledInput
						error={errors.city as FieldError}
						label="City"
						placeholder="Type city"
						{...register('city')}
					/>
					<LabeledInput
						error={errors.postalCode as FieldError}
						label="Postal code"
						placeholder="Type postal code"
						{...register('postalCode')}
					/>
					<LabeledInput
						error={errors.province as FieldError}
						label="State / Province"
						placeholder="Type state / province"
						{...register('province')}
					/>
					<div>
						<CountrySelect
							region={region as HttpTypes.StoreRegion}
							{...register('countryCode')}
							className="h-12"
							value={watch('countryCode')}
						/>
						{errors.countryCode && (
							<p className="label-sm text-negative">
								{(errors.countryCode as FieldError).message}
							</p>
						)}
					</div>

					<LabeledInput
						error={errors.phone as FieldError}
						label="Phone"
						placeholder="Type phone number"
						{...register('phone')}
					/>
				</div>
				{error && <p className="label-md text-negative">{error}</p>}
				<Button className="w-full ">Save address</Button>
			</div>
		</form>
	);
};
