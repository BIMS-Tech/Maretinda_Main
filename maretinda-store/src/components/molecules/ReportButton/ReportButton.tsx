'use client';

import { type FormEvent, useState } from 'react';

import { Modal } from '../Modal/Modal';

const REASONS = [
	'Counterfeit or fake item',
	'Prohibited or unsafe item',
	'Misleading description or photos',
	'Wrong category or price',
	'Trademark or copyright violation',
	'Scam or fraud',
	'Offensive content',
	'Other',
];

const field =
	'w-full mt-1.5 rounded-lg border border-[#DCDCDC] bg-white px-3 py-2.5 text-sm text-[#141414] focus:border-[#432C63] focus:outline-none';

/** A quiet "Report" link that opens a form and files the report with Maretinda. */
export const ReportButton = ({
	kind,
	target,
	email,
}: {
	kind: 'product' | 'seller';
	/** The product's or shop's id or handle. */
	target: string;
	/** The signed-in buyer's email, so they don't have to type it. */
	email?: string | null;
}) => {
	const [open, setOpen] = useState(false);
	const [sent, setSent] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const what = kind === 'product' ? 'listing' : 'shop';

	const close = () => {
		setOpen(false);
		setSent(false);
		setError('');
	};

	const submit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		setBusy(true);
		setError('');
		try {
			const res = await fetch('/api/reports', {
				body: JSON.stringify({
					comment: form.get('comment'),
					email: form.get('email'),
					kind,
					reason: form.get('reason'),
					target,
				}),
				headers: { 'Content-Type': 'application/json' },
				method: 'POST',
			});
			if (res.ok) {
				setSent(true);
			} else {
				const json = await res.json().catch(() => ({}));
				setError(
					res.status === 429
						? 'You have sent several reports already. Please try again later.'
						: json?.message ||
								'We could not send your report. Please try again.',
				);
			}
		} catch {
			setError('We could not send your report. Please try again.');
		} finally {
			setBusy(false);
		}
	};

	return (
		<>
			<button
				className="text-[13px] text-[#6B6B6B] underline underline-offset-2 hover:text-[#432C63]"
				data-testid={`report-${kind}`}
				onClick={() => setOpen(true)}
				type="button"
			>
				Report this {what}
			</button>
			{open && (
				<Modal
					childrenClass="px-6 py-5"
					heading={`Report this ${what}`}
					headingClass="px-6"
					onClose={close}
				>
					{sent ? (
						<div className="text-center py-4">
							<h4 className="text-lg font-semibold text-[#141414]">
								Thank you
							</h4>
							<p className="mt-3 text-sm text-[#6B6B6B]">
								Our team will review this {what} against our
								rules and act on it if needed.
							</p>
							<button
								className="mt-6 rounded-lg bg-[#432C63] px-6 py-2.5 text-sm font-semibold text-white"
								onClick={close}
								type="button"
							>
								Done
							</button>
						</div>
					) : (
						<form onSubmit={submit}>
							<label className="block text-sm font-medium text-[#141414]">
								Reason
								<select
									className={field}
									defaultValue=""
									name="reason"
									required
								>
									<option disabled value="">
										Choose a reason
									</option>
									{REASONS.map((reason) => (
										<option key={reason} value={reason}>
											{reason}
										</option>
									))}
								</select>
							</label>
							<label className="mt-4 block text-sm font-medium text-[#141414]">
								What is wrong?
								<textarea
									className={field}
									maxLength={2000}
									minLength={10}
									name="comment"
									required
									rows={4}
								/>
							</label>
							<label className="mt-4 block text-sm font-medium text-[#141414]">
								Your email (optional, if we may contact you)
								<input
									className={field}
									defaultValue={email ?? ''}
									maxLength={254}
									name="email"
									type="email"
								/>
							</label>
							{error && (
								<p
									className="mt-3 text-sm text-red-600"
									role="alert"
								>
									{error}
								</p>
							)}
							<div className="mt-6 flex justify-end gap-3">
								<button
									className="rounded-lg border border-[#DCDCDC] px-5 py-2.5 text-sm font-medium text-[#141414]"
									onClick={close}
									type="button"
								>
									Cancel
								</button>
								<button
									className="rounded-lg bg-[#432C63] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
									disabled={busy}
									type="submit"
								>
									{busy ? 'Sending…' : 'Send report'}
								</button>
							</div>
						</form>
					)}
				</Modal>
			)}
		</>
	);
};
