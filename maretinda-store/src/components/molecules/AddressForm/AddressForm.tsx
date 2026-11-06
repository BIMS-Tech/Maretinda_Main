'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { HttpTypes } from '@medusajs/types';
import { useState } from 'react';
import {
	Controller,
	type FieldError,
	type FieldValues,
	FormProvider,
	useForm,
	useFormContext,
} from 'react-hook-form';

import { Button } from '@/components/atoms';
import { LabeledInput } from '@/components/cells';
import CountrySelect from '@/components/cells/CountrySelect/CountrySelect';
import { SearchableSelect } from '@/components/cells/SearchableSelect/SearchableSelect';
import { addCustomerAddress, updateCustomerAddress } from '@/lib/data/customer';
import { phCitiesOf, phProvinces } from '@/lib/helpers/ph-locations';
import { toPhMobile } from '@/lib/helpers/ph-mobile';

import { type AddressFormData, addressSchema } from './schema';

interface Props {
	defaultValues?: AddressFormData;

	regions: HttpTypes.StoreRegion[];
	handleClose?: () => void;
}

export const emptyDefaultAddressValues = {
	address: '',
	addressName: '',
	barangay: '',
	city: '',
	company: '',
	countryCode: 'ph',
	firstName: '',
	lastName: '',
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
		control,
		formState: { errors },
		setValue,
		watch,
	} = useFormContext();
	const province = watch('province');

	const region = {
		countries: regions.flatMap((region) => region.countries),
	};

	const submit = async (data: FieldValues) => {
		const formData = new FormData();
		formData.append('addressId', data.addressId || '');
		formData.append('address_name', data.addressName || '');
		formData.append('first_name', data.firstName);
		formData.append('last_name', data.lastName);
		formData.append('address_1', data.address);
		formData.append('address_2', data.barangay);
		formData.append('city', data.city);
		formData.append('country_code', data.countryCode);
		formData.append('postal_code', data.postalCode);
		formData.append('company', data.company || '');
		formData.append('phone', toPhMobile(data.phone) ?? data.phone);
		formData.append('province', data.province);

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
			<div className="space-y-4">
				<div className="max-w-full grid grid-cols-2 items-top gap-3 mb-8">
					<LabeledInput
						error={errors.firstName as FieldError}
						important
						inputClassName="focus:border-[#2563EB] focus:outline-none focus:ring-2 border border-black/10 bg-white"
						label="First name"
						placeholder="Enter your first name..."
						{...register('firstName')}
					/>
					<LabeledInput
						error={errors.lastName as FieldError}
						important
						inputClassName="focus:border-[#2563EB] focus:outline-none focus:ring-2 border border-black/10 bg-white"
						label="Last name"
						placeholder="Enter your last name..."
						{...register('lastName')}
					/>
					<LabeledInput
						error={errors.phone as FieldError}
						important
						inputClassName="focus:border-[#2563EB] focus:outline-none focus:ring-2 border border-black/10 bg-white pl-[56px]"
						icon={<span className="text-base text-black/70">+63</span>}
						inputMode="tel"
						label="Mobile Number"
						placeholder="917 123 4567"
						{...register('phone')}
					/>
					<LabeledInput
						error={errors.addressName as FieldError}
						inputClassName="focus:border-[#2563EB] focus:outline-none focus:ring-2 border border-black/10 bg-white"
						label="Address Label"
						placeholder="e.g. Home, Office"
						{...register('addressName')}
					/>
					<div>
						<CountrySelect
							error={errors.countryCode as FieldError}
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
						error={errors.address as FieldError}
						important
						inputClassName="focus:border-[#2563EB] focus:outline-none focus:ring-2 border border-black/10 bg-white"
						label="Street Address"
						placeholder="Enter your address..."
						{...register('address')}
					/>
					<Controller
						control={control}
						name="province"
						render={({ field, fieldState }) => (
							<SearchableSelect
								error={fieldState.error}
								important
								label="Province"
								onChange={(value) => {
									if (value === field.value) return;
									field.onChange(value);
									setValue('city', '');
								}}
								options={phProvinces}
								placeholder="Choose a province"
								testId="address-province-select"
								value={field.value}
							/>
						)}
					/>
					<Controller
						control={control}
						name="city"
						render={({ field, fieldState }) => (
							<SearchableSelect
								disabled={!province}
								error={fieldState.error}
								important
								label="City/Municipality"
								onChange={field.onChange}
								options={phCitiesOf(province)}
								placeholder={
									province
										? 'Choose a city'
										: 'Choose a province first'
								}
								testId="address-city-select"
								value={field.value}
							/>
						)}
					/>
					<LabeledInput
						error={errors.barangay as FieldError}
						important
						inputClassName="focus:border-[#2563EB] focus:outline-none focus:ring-2 border border-black/10 bg-white"
						label="Barangay"
						placeholder="Enter your barangay..."
						{...register('barangay')}
					/>
					<LabeledInput
						error={errors.postalCode as FieldError}
						important
						inputClassName="focus:border-[#2563EB] focus:outline-none focus:ring-2 border border-black/10 bg-white"
						label="Postal code"
						placeholder="Enter your postal code..."
						{...register('postalCode')}
					/>
					<LabeledInput
						className="col-span-2"
						error={errors.company as FieldError}
						inputClassName="focus:border-[#2563EB] focus:outline-none focus:ring-2 border border-black/10 bg-white"
						label="Company"
						placeholder="Enter your company..."
						{...register('company')}
					/>
				</div>
				{error && <p className="label-md text-negative">{error}</p>}
				<div className="flex justify-end gap-2">
					<Button
						className="w-fit px-2 py-1 bg-white !text-[13px] rounded-[6px] border border-black/10 shadow-sm !font-medium"
						onClick={handleClose}
						type="button"
					>
						Cancel
					</Button>
					<Button
						className="w-fit px-2 py-1 !text-[13px] !font-medium rounded-[6px]"
						type="submit"
					>
						Save
					</Button>
				</div>
			</div>
		</form>
	);
};
