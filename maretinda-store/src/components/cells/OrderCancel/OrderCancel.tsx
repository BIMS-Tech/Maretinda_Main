'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/atoms';
import { Modal } from '@/components/molecules';
import { cancelOrder } from '@/lib/data/orders';

export const OrderCancel = ({ order }: { order: any }) => {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleCancel = async () => {
		setBusy(true);
		setError(null);
		const result = await cancelOrder(order.id);
		setBusy(false);
		if (!result.ok) {
			setError(result.message);
			return;
		}
		setOpen(false);
		router.refresh();
	};

	return (
		<>
			<div className="md:flex justify-between items-center">
				<div className="mb-4 md:mb-0">
					<h2 className="text-primary label-lg uppercase">
						Cancel Order
					</h2>
					<p className="text-secondary label-md max-w-sm">
						You can cancel this order until the seller begins
						preparing it for shipment.
					</p>
				</div>
				<Button
					className="uppercase"
					onClick={() => setOpen(true)}
					variant="tonal"
				>
					Cancel order
				</Button>
			</div>
			{open && (
				<Modal
					heading="Cancel this order?"
					onClose={() => setOpen(false)}
				>
					<div className="px-4 pb-4">
						<p className="text-secondary label-md mb-4">
							The whole order will be cancelled and the seller
							will be told. This can&apos;t be undone.
						</p>
						{error && (
							<p
								className="text-negative label-md mb-4"
								role="alert"
							>
								{error}
							</p>
						)}
						<div className="flex gap-3 justify-end">
							<Button
								disabled={busy}
								onClick={() => setOpen(false)}
								variant="tonal"
							>
								Keep order
							</Button>
							<Button disabled={busy} onClick={handleCancel}>
								{busy ? 'Cancelling…' : 'Yes, cancel order'}
							</Button>
						</div>
					</div>
				</Modal>
			)}
		</>
	);
};
