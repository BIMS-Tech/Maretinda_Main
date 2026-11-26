'use client';

import { useEffect, useState } from 'react';

import { RefundAccountFields } from '@/components/cells/RefundAccountFields/RefundAccountFields';
import { addRefundAccount, getOrderRefunds } from '@/lib/data/returns';
import { EMPTY_PAYOUT, type Payout, peso, shortDate } from '@/lib/returns-policy';

const KIND: Record<string, string> = { cancellation: 'Cancellation refund', failed_delivery: 'Refund for a failed delivery', return: 'Return refund' };

/** Refunds on an order: amount, when, where to, and once sent the reference number. Plus a pending cancellation. */
export const OrderRefunds = ({ orderId }: { orderId: string }) => {
	const [data, setData] = useState<{ cancellation: any; refunds: any[] } | null>(null);
	const [payout, setPayout] = useState<Payout>(EMPTY_PAYOUT);
	const [error, setError] = useState('');

	const load = () => getOrderRefunds(orderId).then((r) => r.ok && setData(r));
	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [orderId]);

	if (!data || (!data.refunds.length && data.cancellation?.status !== 'pending' && data.cancellation?.status !== 'rejected')) return null;

	return (
		<div className="flex flex-col gap-3 pt-4" data-testid="order-refunds">
			{data.cancellation?.status === 'pending' && (
				<p className="rounded-lg bg-[#F6F2FB] px-4 py-3 text-[13px]">
					You asked to cancel this order. We&apos;ve asked the seller to hold it and will confirm by email.
				</p>
			)}
			{data.cancellation?.status === 'rejected' && (
				<p className="rounded-lg bg-black/[0.03] px-4 py-3 text-[13px]">
					We couldn&apos;t cancel this order{data.cancellation.decision_note ? `: ${data.cancellation.decision_note}` : '.'}
				</p>
			)}
			{data.refunds.map((r) => (
				<div className="rounded-lg bg-[#F6F2FB] px-4 py-3 text-[14px]" key={r.id}>
					<p className="text-[12px] font-semibold uppercase tracking-wide text-[#432C63]">{KIND[r.kind] ?? 'Refund'}</p>
					{r.status === 'paid' ? (
						<>
							<p className="font-semibold">
								{peso(r.paid_amount)} sent to {r.payout_label} on {shortDate(r.paid_at)}
							</p>
							<p className="text-[13px] text-black/65">Reference number: {r.reference}</p>
						</>
					) : (
						<p className="font-semibold">
							{peso(r.amount)}
							{r.payout_label ? ` to ${r.payout_label}` : ''}, by {shortDate(r.due_by)} at the latest
						</p>
					)}
					{r.deductions?.length > 0 && (
						<p className="mt-1 text-[12px] text-black/55">Taken off: {r.deductions.map((d: any) => `${d.label} ${peso(d.amount)}`).join('; ')}</p>
					)}
					{r.status === 'due' && !r.payout_label && (
						<div className="mt-3 flex flex-col gap-2">
							<RefundAccountFields onChange={setPayout} value={payout} />
							<div>
								<button
									className="rounded-lg bg-[#432C63] px-4 py-2 text-[13px] font-medium text-white"
									onClick={async () => {
										setError('');
										const res = await addRefundAccount(r.id, payout);
										if (!res.ok) setError(res.message);
										else load();
									}}
									type="button"
								>
									Save refund account
								</button>
							</div>
							{error && (
								<p className="text-[13px] text-red-600" role="alert">
									{error}
								</p>
							)}
						</div>
					)}
				</div>
			))}
		</div>
	);
};
