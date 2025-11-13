'use client';

// import { ProfilePasswordForm } from "../ProfilePasswordForm/ProfilePasswordForm"
import type { HttpTypes } from '@medusajs/types';
import { Divider } from '@medusajs/ui';
import { useState } from 'react';

import { Button } from '@/components/atoms';
import { Card } from '@/components/atoms/Card/Card';
import { ProfileHeading } from '@/components/atoms/Heading/ProfileHeading';
import { InfoIcon } from '@/icons';
import { sendResetPasswordEmail } from '@/lib/data/customer';
import { cn } from '@/lib/utils';

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
			<ProfileHeading
				buttonText="Change Password"
				className="mt-12"
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
				<div className="pt-6 pb-4 px-[19px]">
					<p className="text-[14px] leading-[25px]">
						Current password
					</p>
					<p className="text-base font-bold">****************</p>
				</div>
				<Divider />
				<div className="py-6 px-[19px]">
					<p className="flex items-center gap-2 text-base">
						<InfoIcon size={15} />
						Always remember to choose a unique password to protect
						your account.
					</p>
				</div>
			</Card>
			{showForm && (
				<Modal
					heading="Change password"
					headingClass="py-[19px] px-6 text-black font-medium"
					modalClass="py-[9.5px]"
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
