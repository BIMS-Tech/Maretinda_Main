'use client';

import type { HttpTypes } from '@medusajs/types';
import { Divider } from '@medusajs/ui';
import { useState } from 'react';

import { Card } from '@/components/atoms';
import { ProfileHeading } from '@/components/atoms/Heading/ProfileHeading';
import { cn } from '@/lib/utils';

import { Modal } from '../Modal/Modal';
import { ProfileDetailsForm } from '../ProfileDetailsForm/ProfileDetailsForm';

export const ProfileDetails = ({ user }: { user: HttpTypes.StoreCustomer }) => {
	const [showForm, setShowForm] = useState(false);

	return (
		<>
			<ProfileHeading
				buttonText="Edit Details"
				onButtonClick={() => setShowForm(true)}
				title="Profile Details"
			/>
			<Card
				className={cn(
					'p-0 rounded-t-none',
					'shadow-[0px_4px_8px_0px_#00000014,_0px_2px_4px_0px_#00000014,_0px_0px_0px_1px_#00000014]',
					'text-black',
				)}
			>
				<div className="py-6 px-[19px]">
					<p className="text-[14px]">Name</p>
					<p className="text-base font-bold">
						{`${user.first_name} ${user.last_name}`}
					</p>
				</div>
				<Divider />
				<div className="py-6 px-[19px]">
					<p className="text-[14px]">Email</p>
					<p className="text-base font-bold">{user.email}</p>
				</div>
				<Divider />
				<div className="py-6 px-[19px]">
					<p className="text-[14px]">Phone number</p>
					<p className="text-base font-bold">{user.phone}</p>
				</div>
			</Card>
			{showForm && (
				<Modal
					heading="Edit profile details"
					headingClass="py-[19px] px-6 text-black font-medium"
					modalClass="py-[9.5px]"
					onClose={() => setShowForm(false)}
				>
					<ProfileDetailsForm
						defaultValues={{
							email: user.email || '',
							firstName: user.first_name || '',
							lastName: user.last_name || '',
							phone: user.phone || '',
						}}
						handleClose={() => setShowForm(false)}
					/>
				</Modal>
			)}
		</>
	);
};
