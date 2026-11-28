'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/atoms';
import { account } from '@/lib/account-styles';
import { Modal } from '@/components/molecules';
import { RefundAccountFields } from '@/components/cells/RefundAccountFields/RefundAccountFields';
import { requestCancellation } from '@/lib/data/returns';
import { EMPTY_PAYOUT, type Payout } from '@/lib/returns-policy';

/**
 * A paid-online order can't be cancelled by the buyer alone: Maretinda asks
 * the seller to hold it and refunds it, less the payment processing fee.
 */
export const RequestCancellation = ({ order }: { order: any }) => {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [reason, setReason] = useState('');
	const [payout, setPayout] = useState<Payout>(EMPTY_PAYOUT);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');

	const send = async () => {
		setBusy(true);
		setError('');
		const r = await requestCancellation({ order_id: order.id, payout, reason });
		setBusy(false);
		if (!r.ok) return setError(r.message);
		setOpen(false);
		router.refresh();
	};

	return (
		<>
			<div className={`${account.panel} flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}>
				<div>
					<h2 className={account.panelTitle}>Cancel this order</h2>
					<p className={account.panelText}>
						Paid online and not shipped yet? Ask us to cancel it. You get back what you paid, less the payment processing
						fee.
					</p>
				</div>
				<Button className={`${account.outlineButton} shrink-0`} onClick={() => setOpen(true)} variant="tonal">
					Request cancellation
				</Button>
			</div>
			{open && (
				<Modal heading="Request cancellation" onClose={() => setOpen(false)}>
					<div className="flex flex-col gap-4 px-4 pb-4">
						<label className="flex flex-col gap-1 text-[13px]">
							Why do you want to cancel?
							<textarea
								className="min-h-16 rounded-lg border border-black/15 px-3 py-2 text-[14px]"
								maxLength={500}
								onChange={(e) => setReason(e.target.value)}
								value={reason}
							/>
						</label>
						<RefundAccountFields onChange={setPayout} value={payout} />
						<p className="text-[12px] text-black/55">
							We ask the seller to hold your order and confirm by email. If it has already shipped, it can&apos;t be cancelled,
							but you can ask for a return once it arrives.
						</p>
						{error && (
							<p className="text-[13px] text-red-600" role="alert">
								{error}
							</p>
						)}
						<Button disabled={busy} onClick={send}>
							{busy ? 'Sending…' : 'Send request'}
						</Button>
					</div>
				</Modal>
			)}
		</>
	);
};
