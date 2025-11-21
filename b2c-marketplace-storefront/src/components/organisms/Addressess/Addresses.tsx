'use client';

import type { HttpTypes } from '@medusajs/types';
import { isEmpty } from 'lodash';
import { useState } from 'react';

import { Button, Card } from '@/components/atoms';
import { AddressForm, Modal } from '@/components/molecules';
import { emptyDefaultAddressValues } from '@/components/molecules/AddressForm/AddressForm';
import type { AddressFormData } from '@/components/molecules/AddressForm/schema';
import { deleteCustomerAddress } from '@/lib/data/customer';
import { cn } from '@/lib/utils';

export const Addresses = ({
	user,
	regions,
}: {
	user: HttpTypes.StoreCustomer;
	regions: HttpTypes.StoreRegion[];
}) => {
	const [showForm, setShowForm] = useState(false);
	const [deleteAddress, setDeleteAddress] = useState<string | null>(null);

	const [defaultValues, setDefaultValues] = useState<AddressFormData | null>(
		null,
	);

	const countries = regions.flatMap((region) => region.countries);

	const handleEdit = (addressId: string) => {
		const address = user.addresses.find(
			(address) => address.id === addressId,
		);
		if (address) {
			setDefaultValues({
				address: address.address_1 || '',
				addressId: addressId,
				addressName: address.address_name || '',
				city: address.city || '',
				company: address.company || '',
				countryCode: address.country_code || '',
				email: user.email || '',
				firstName: address.first_name || '',
				lastName: address.last_name || '',
				phone: address.phone || user.phone || '',
				postalCode: address.postal_code || '',
				province: address.province || '',
			});
			setShowForm(true);
		}
	};

	const handleDelete = async (addressId: string) => {
		await deleteCustomerAddress(addressId);
		setDeleteAddress(null);
	};

	const handleAdd = () => {
		setDefaultValues(emptyDefaultAddressValues);
		setDeleteAddress(null);
		setShowForm(true);
	};

	return (
		<>
			<div
				className={cn(
					'md:col-span-3 user-content-wrapper h-full',
					isEmpty(user.addresses)
						? 'space-y-8 p-1 before'
						: 'space-y-10',
				)}
			>
				<h1 className="text-3xl capitalize text-black font-lora !font-bold">
					Addresses
				</h1>
				{isEmpty(user.addresses) ? (
					<div className="flex flex-col text-center items-center w-full lg:pt-24 lg:px-26">
						<p className="text-5xl font-bold font-lora text-primary w-full">
							No saved shipping addresses
						</p>
						<p className="text-base font-normal text-black text-secondary w-full mt-6">
							You currently have no saved shipping addresses.{' '}
							<br />
							Add an address to make your checkout process quicker
							and easier.
						</p>
						<Button
							className="mt-6 !font-medium text-md px-14 pt-[10px]"
							onClick={handleAdd}
						>
							Add Shipping Address
						</Button>
					</div>
				) : (
					<div className="flex flex-col gap-4 items-start">
						{user.addresses.map((address) => (
							<Card
								className="px-8 py-[42px] flex justify-between items-start gap-4 w-full"
								key={address.id}
							>
								<div className="flex flex-col ">
									<h4 className="text-2xl font-semibold text-primary mb-6">
										{address.address_name}
									</h4>
									<p className="text-base text-primary">
										{`${address.first_name} ${address.last_name}`}
									</p>
									{address.company && (
										<p className="text-base text-primary">
											{address.company}
										</p>
									)}
									<p className="text-base text-primary">
										{`${address.address_1}, ${address.postal_code} ${
											address.city
										}${address.province ? `, ${address.province}` : ''}${`, ${
											countries.find(
												(country) =>
													country &&
													country.iso_2 ===
														address.country_code,
											)?.display_name ||
											address.country_code?.toUpperCase()
										}`}`}
									</p>
									<p className="text-base text-primary">
										{`${user.email}, ${address.phone || user.phone}`}
									</p>
								</div>
								<div className="flex gap-2 sm:gap-4 flex-col-reverse sm:flex-row">
									<Button
										className="w-fit px-4 md:px-8 py-1 md:py-2.5 !font-medium"
										onClick={() => handleEdit(address.id)}
									>
										Edit
									</Button>
									<Button
										className="w-fit px-4 md:px-8 py-1 md:py-2.5 !font-medium"
										onClick={() =>
											setDeleteAddress(address.id)
										}
									>
										Delete
									</Button>
								</div>
							</Card>
						))}
						{user.addresses.length < 6 && (
							<Button
								className="!font-medium text-md px-14 pt-[10px]"
								onClick={handleAdd}
							>
								Add Shipping Address
							</Button>
						)}
					</div>
				)}
			</div>
			{showForm && (
				<Modal
					childrenClass="p-6 flex-1 overflow-y-auto"
					heading="Shipping Address"
					headingClass="!font-semibold max-h-[60px] pb-4 px-6 flex-row text-black"
					modalClass="max-w-[670px] flex flex-col"
					onClose={() => setShowForm(false)}
				>
					<AddressForm
						defaultValues={
							defaultValues || emptyDefaultAddressValues
						}
						handleClose={() => setShowForm(false)}
						regions={regions}
					/>
				</Modal>
			)}
			{deleteAddress && (
				<Modal
					childrenClass="px-6 pt-6"
					heading="Shipping Address"
					headingClass="!font-semibold max-h-[60px] pb-4 px-6 flex-row text-black"
					onClose={() => setDeleteAddress(null)}
				>
					<div className="flex flex-col gap-4 text-base font-normal">
						<p>Are you sure you want to delete this address?</p>
						<div className="flex justify-end gap-2">
							<Button
								className="w-fit px-2 py-1 bg-white border border-black/10 shadow-sm !font-medium"
								onClick={() => setDeleteAddress(null)}
								type="button"
							>
								Cancel
							</Button>
							<Button
								className="w-fit px-2 py-1 !font-medium"
								onClick={() => handleDelete(deleteAddress)}
								type="submit"
							>
								Delete
							</Button>
						</div>
					</div>
				</Modal>
			)}
		</>
	);
};
