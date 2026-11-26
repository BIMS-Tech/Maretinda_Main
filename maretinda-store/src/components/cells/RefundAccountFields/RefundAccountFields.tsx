'use client';

import type { Payout } from '@/lib/returns-policy';

const FIELD =
	'w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-[14px] outline-none focus:border-[#432C63] focus:ring-2 focus:ring-[#432C63]/10';

/** Where Maretinda sends a refund: GCash, Maya or a bank account (InstaPay). */
export const RefundAccountFields = ({ value, onChange }: { value: Payout; onChange: (p: Payout) => void }) => {
	const set = (key: keyof Payout) => (e: { target: { value: string } }) => onChange({ ...value, [key]: e.target.value });
	return (
		<fieldset className="flex flex-col gap-3" data-testid="refund-account">
			<legend className="mb-1 text-[14px] font-semibold text-[#1B1B1B]">Where should we send your refund?</legend>
			<div className="flex flex-wrap gap-2">
				{(
					[
						['gcash', 'GCash'],
						['maya', 'Maya'],
						['bank', 'Bank account (InstaPay)'],
					] as const
				).map(([method, label]) => (
					<label
						className={`cursor-pointer rounded-full border px-3 py-1.5 text-[13px] ${value.method === method ? 'border-[#432C63] bg-[#432C63] text-white' : 'border-black/15 bg-white text-[#1B1B1B]'}`}
						key={method}
					>
						<input
							checked={value.method === method}
							className="sr-only"
							name="refund-method"
							onChange={() => onChange({ ...value, method })}
							type="radio"
						/>
						{label}
					</label>
				))}
			</div>
			{value.method && (
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{value.method === 'bank' && (
						<label className="flex flex-col gap-1 text-[13px] sm:col-span-2">
							Bank
							<input className={FIELD} onChange={set('bank_name')} placeholder="BPI, BDO, Metrobank…" value={value.bank_name ?? ''} />
						</label>
					)}
					<label className="flex flex-col gap-1 text-[13px]">
						Account name
						<input className={FIELD} onChange={set('account_name')} placeholder="As it appears on the account" value={value.account_name} />
					</label>
					<label className="flex flex-col gap-1 text-[13px]">
						{value.method === 'bank' ? 'Account number' : 'Mobile number'}
						<input
							className={FIELD}
							inputMode="numeric"
							onChange={set('account_number')}
							placeholder={value.method === 'bank' ? 'Digits only' : '0917 123 4567'}
							value={value.account_number}
						/>
					</label>
				</div>
			)}
			<p className="text-[12px] text-black/55">
				Maretinda&apos;s accounting team sends refunds by hand. Only they see these details.
			</p>
		</fieldset>
	);
};
