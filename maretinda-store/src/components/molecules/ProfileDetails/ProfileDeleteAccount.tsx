'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/atoms';
import { deleteAccount } from '@/lib/data/customer';
import { isDeletionConfirmed } from '@/lib/helpers/account-deletion';

import { Modal } from '../Modal/Modal';

export const ProfileDeleteAccount = () => {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [confirmation, setConfirmation] = useState('');
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const close = () => {
		setOpen(false);
		setConfirmation('');
		setError(null);
	};

	const handleDelete = async () => {
		setDeleting(true);
		setError(null);
		const res = await deleteAccount();
		if (res.success) {
			router.replace('/');
			router.refresh();
			return;
		}
		setError(res.error ?? null);
		setDeleting(false);
	};

	return (
		<>
			<div className="border rounded-sm p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div>
					<h2 className="heading-sm uppercase">Delete account</h2>
					<p className="text-base text-secondary mt-1">
						Permanently remove your account, saved addresses and
						sign-in. Your past orders stay on record for the shops.
					</p>
				</div>
				<Button
					className="uppercase py-3 px-6 !font-semibold shrink-0"
					onClick={() => setOpen(true)}
					variant="tonal"
				>
					Delete account
				</Button>
			</div>

			{open && (
				<Modal
					heading="Delete your account?"
					headingClass="py-[19px] px-6 text-black font-medium"
					onClose={close}
				>
					<div className="flex flex-col gap-4 p-6">
						<p className="text-base">
							This can't be undone. Your profile, saved addresses,
							wishlist and sign-in will be removed. You can't
							delete your account while an order is still on its
							way.
						</p>
						<label className="flex flex-col gap-2 text-base">
							Type DELETE to confirm
							<input
								autoComplete="off"
								className="border rounded-sm px-4 py-3"
								onChange={(e) =>
									setConfirmation(e.target.value)
								}
								value={confirmation}
							/>
						</label>
						{error && (
							<p className="text-sm text-negative" role="alert">
								{error}
							</p>
						)}
						<div className="flex justify-end gap-3">
							<Button onClick={close} variant="tonal">
								Cancel
							</Button>
							<Button
								disabled={
									!isDeletionConfirmed(confirmation) ||
									deleting
								}
								loading={deleting}
								onClick={handleDelete}
								variant="destructive"
							>
								Delete my account
							</Button>
						</div>
					</div>
				</Modal>
			)}
		</>
	);
};
