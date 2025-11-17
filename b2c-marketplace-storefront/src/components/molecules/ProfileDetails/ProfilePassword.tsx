'use client';

// import { ProfilePasswordForm } from "../ProfilePasswordForm/ProfilePasswordForm"
import type { HttpTypes } from '@medusajs/types';
import { useState } from 'react';

import { Button } from '@/components/atoms';
import { InfoIcon } from '@/icons';
import { sendResetPasswordEmail } from '@/lib/data/customer';

import { Modal } from '../Modal/Modal';
import { ProfileDetailsAccordion } from './ProfileDetailsAccordion';

export const ProfilePassword = ({
	user,
}: {
	user: HttpTypes.StoreCustomer;
}) => {
	const [showForm, setShowForm] = useState(false);

	const handleSendResetPasswordEmail = async () => {
		const res = await sendResetPasswordEmail(user.email);
		if (res.success) {
			setShowForm(false);
		}
	};

	const passwordDetails = [
		{ label: 'Current password', value: '****************' },
		<p className="flex items-center gap-2 text-base" key={1}>
			<InfoIcon size={15} />
			Always remember to choose a unique password to protect your account.
		</p>,
	];

	return (
		<>
			<ProfileDetailsAccordion
				buttonText="Change Password"
				contents={passwordDetails}
				onButtonClick={() => setShowForm(true)}
				title="Profile Details"
			/>

			{showForm && (
				<Modal
					heading="Change password"
					headingClass="py-[19px] px-6 text-black font-medium"
					onClose={() => setShowForm(false)}
				>
					<div className="flex p-4 justify-center">
						<Button
							className="uppercase py-3 px-6 !font-semibold"
							onClick={handleSendResetPasswordEmail}
						>
							Send reset password email
						</Button>
					</div>
					{/* <ProfilePasswordForm user={user} /> */}
				</Modal>
			)}
		</>
	);
};
