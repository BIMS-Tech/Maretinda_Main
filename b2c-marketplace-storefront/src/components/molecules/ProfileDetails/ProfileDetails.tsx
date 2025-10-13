'use client';

import { PencilSquare } from '@medusajs/icons';
import type { HttpTypes } from '@medusajs/types';
import { Divider, Heading } from '@medusajs/ui';
import { useState } from 'react';

import { Button, Card } from '@/components/atoms';

import { Modal } from '../Modal/Modal';
import { ProfileDetailsForm } from '../ProfileDetailsForm/ProfileDetailsForm';

export const ProfileDetails = ({ user }: { user: HttpTypes.StoreCustomer }) => {
	const [showForm, setShowForm] = useState(false);

	return (
		<>
			<Card className="bg-secondary p-4 flex justify-between items-center">
				<Heading className="heading-sm uppercase" level="h2">
					Profile details
				</Heading>
				<Button
					className="uppercase flex items-center gap-2 font-semibold"
					onClick={() => setShowForm(true)}
					variant="tonal"
				>
					<PencilSquare />
					Edit details
				</Button>
			</Card>
			<Card className="p-0">
				<div className="p-4">
					<p className="label-md text-secondary">Name</p>
					<p className="label-lg text-primary">
						{`${user.first_name} ${user.last_name}`}
					</p>
				</div>
				<Divider />
				<div className="p-4">
					<p className="label-md text-secondary">Email</p>
					<p className="label-lg text-primary">{user.email}</p>
				</div>
				<Divider />
				<div className="p-4">
					<p className="label-md text-secondary">Phone number</p>
					<p className="label-lg text-primary">{user.phone}</p>
				</div>
			</Card>
			{showForm && (
				<Modal
					heading="Edit profile details"
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
