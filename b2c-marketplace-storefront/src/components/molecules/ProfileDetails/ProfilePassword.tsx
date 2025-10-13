'use client';

// import { ProfilePasswordForm } from "../ProfilePasswordForm/ProfilePasswordForm"
import type { HttpTypes } from '@medusajs/types';
import { Divider, Heading } from '@medusajs/ui';
import { useState } from 'react';

import { Button } from '@/components/atoms';
import { Card } from '@/components/atoms/Card/Card';
import { InfoIcon } from '@/icons';
import { sendResetPasswordEmail } from '@/lib/data/customer';

import { Modal } from '../Modal/Modal';

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

	return (
		<>
			<Card className="bg-secondary p-4 flex justify-between items-center mt-8">
				<Heading className="heading-sm uppercase" level="h2">
					Password
				</Heading>
				<Button
					className="uppercase flex items-center gap-2 font-semibold"
					onClick={() => setShowForm(true)}
					variant="tonal"
				>
					Change password
				</Button>
			</Card>
			<Card className="p-0">
				<div className="p-4">
					<p className="label-md text-secondary">Current password</p>
					<p className="label-lg text-primary">****************</p>
				</div>
				<Divider />
				<div className="p-4">
					<p className="label-md text-secondary flex items-center gap-4">
						<InfoIcon className="text-secondary" size={18} />
						Always remember to choose a unique password to protect
						your account.
					</p>
				</div>
			</Card>
			{showForm && (
				<Modal
					heading="Change password"
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
