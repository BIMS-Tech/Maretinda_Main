'use client';

import type { HttpTypes } from '@medusajs/types';
import { useState } from 'react';

import { Modal } from '../Modal/Modal';
import { ProfileDetailsForm } from '../ProfileDetailsForm/ProfileDetailsForm';
import { ProfileDetailsAccordion } from './ProfileDetailsAccordion';

export const ProfileDetails = ({ user }: { user: HttpTypes.StoreCustomer }) => {
	const [showForm, setShowForm] = useState(false);

	const profileDetails = [
		{ label: 'name', value: `${user.first_name} ${user.last_name}` },
		{ label: 'email', value: user.email || '' },
		{ label: 'phone number', value: user.phone || '' },
	];

	return (
		<>
			<ProfileDetailsAccordion
				buttonText="Edit Details"
				contents={profileDetails}
				onButtonClick={() => setShowForm(true)}
				title="Profile Details"
			/>
			{showForm && (
				<Modal
					heading="Edit profile details"
					headingClass="py-[19px] px-6 text-black font-medium"
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
