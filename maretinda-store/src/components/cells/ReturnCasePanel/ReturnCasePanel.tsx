'use client';

import { useEffect, useState } from 'react';

import { escalateReturn, getReturnCase, markReturnShipped } from '@/lib/data/returns';
import { longDate, peso, shortDate } from '@/lib/returns-policy';

const FIELD = 'rounded-lg border border-black/15 bg-white px-3 py-2 text-[14px] outline-none focus:border-[#432C63]';

/** Where a return stands, what the buyer does next, and the refund with its proof. */
export const ReturnCasePanel = ({ requestId }: { requestId: string }) => {
	const [c, setCase] = useState<any>(null);
	const [missing, setMissing] = useState(false);
	const [ship, setShip] = useState({ courier: '', fee: '', tracking_number: '' });
	const [note, setNote] = useState('');
	const [error, setError] = useState('');
	const [busy, setBusy] = useState(false);

	const load = () =>
		getReturnCase(requestId).then((r) => {
			if (r.ok) setCase(r.return_case);
			else setMissing(true);
		});
	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [requestId]);

	const act = async (run: () => Promise<{ ok: boolean; message?: string }>) => {
		setError('');
		setBusy(true);
		const r = await run();
		setBusy(false);
		if (!r.ok) setError(r.message ?? 'Something went wrong.');
		else load();
	};

	// Requests made before the new process have no case; their status shows above as before
	if (missing) return null;
	if (!c) return <p className="p-4 text-[13px] text-black/50">Loading…</p>;
	const refund = c.refund;

	return (
		<div className="flex flex-col gap-3 p-4 text-[14px]" data-stage={c.stage} data-testid="return-case">
			<p className="text-[15px] font-semibold text-[#432C63]">{refund?.status === 'paid' ? 'Refunded' : c.stage_label}</p>

			{c.stage === 'seller_review' && <p>The seller has until {longDate(c.respond_by)} to answer. If they don&apos;t, it is approved automatically.</p>}

			{c.stage === 'declined' && (
				<div className="flex flex-col gap-2">
					<p>The seller disputed your claim{c.seller_note ? `: “${c.seller_note}”` : '.'}</p>
					<p>If you disagree, ask Maretinda to decide. We look at both sides and decide within 7 days.</p>
					<textarea className={`${FIELD} min-h-16`} onChange={(e) => setNote(e.target.value)} placeholder="Why you disagree" value={note} />
					<div>
						<button
							className="rounded-lg bg-[#432C63] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-60"
							disabled={busy}
							onClick={() => act(() => escalateReturn(requestId, note))}
							type="button"
						>
							Escalate to Maretinda
						</button>
					</div>
				</div>
			)}

			{c.stage === 'escalated' && <p>Maretinda is reviewing both sides and will decide by {shortDate(c.decide_by)}.</p>}

			{c.stage === 'awaiting_return' && (
				<div className="flex flex-col gap-2">
					<p>
						Send the item back by <b>{shortDate(c.ship_back_by)}</b>, unused and with all its packaging, tags, manuals and freebies.
					</p>
					{c.return_instructions && <p>From the seller: {c.return_instructions}</p>}
					{c.return_address && (
						<p>
							Send it to: <span className="font-medium">{c.return_address}</span>
						</p>
					)}
					<p className="text-[13px] text-black/60">Then enter the courier&apos;s details. What you paid to send it is added to your refund.</p>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
						<input aria-label="Courier" className={FIELD} onChange={(e) => setShip({ ...ship, courier: e.target.value })} placeholder="Courier (e.g. J&T)" value={ship.courier} />
						<input aria-label="Tracking number" className={FIELD} onChange={(e) => setShip({ ...ship, tracking_number: e.target.value })} placeholder="Tracking number" value={ship.tracking_number} />
						<input aria-label="Postage paid" className={FIELD} inputMode="decimal" onChange={(e) => setShip({ ...ship, fee: e.target.value })} placeholder="Postage paid (₱)" value={ship.fee} />
					</div>
					<div>
						<button
							className="rounded-lg bg-[#432C63] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-60"
							disabled={busy}
							onClick={() => act(() => markReturnShipped(requestId, ship))}
							type="button"
						>
							I&apos;ve sent it
						</button>
					</div>
				</div>
			)}

			{c.stage === 'in_transit' && (
				<p>
					On its way back with {c.return_courier} ({c.return_tracking}). The seller checks it within 48 hours of receiving it.
				</p>
			)}
			{c.stage === 'inspecting' && <p>The seller has it and is checking it, until {longDate(c.inspect_by)}.</p>}
			{c.stage === 'closed' && <p>{c.decision_note || 'This return is closed.'}</p>}

			{refund && (
				<div className="rounded-lg bg-[#F6F2FB] px-4 py-3" data-testid="refund">
					{refund.status === 'paid' ? (
						<>
							<p className="font-semibold">
								{peso(refund.paid_amount)} sent to {refund.payout_label} on {shortDate(refund.paid_at)}
							</p>
							<p className="text-[13px] text-black/65">Reference number: {refund.reference}</p>
						</>
					) : (
						<>
							<p className="font-semibold">
								Refund of {peso(refund.amount)} to {refund.payout_label ?? 'your account'}
							</p>
							<p className="text-[13px] text-black/65">
								Within {refund.business_days[0]}–{refund.business_days[1]} business days, by {shortDate(refund.due_by)} at the latest.
							</p>
						</>
					)}
					{refund.deductions?.length > 0 && (
						<p className="mt-1 text-[12px] text-black/55">
							Taken off: {refund.deductions.map((d: any) => `${d.label} ${peso(d.amount)}`).join('; ')}
						</p>
					)}
				</div>
			)}
			{c.decision_note && c.stage !== 'closed' && <p className="text-[13px] text-black/60">Maretinda&apos;s decision: {c.decision_note}</p>}
			{error && (
				<p className="text-[13px] text-red-600" role="alert">
					{error}
				</p>
			)}
		</div>
	);
};
