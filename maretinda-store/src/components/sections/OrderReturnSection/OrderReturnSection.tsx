'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { EvidenceUploader, type Uploaded } from '@/components/cells/EvidenceUploader/EvidenceUploader';
import { RefundAccountFields } from '@/components/cells/RefundAccountFields/RefundAccountFields';
import { UserNavigation } from '@/components/molecules';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { account } from '@/lib/account-styles';
import { openReturn, type ReturnCaseSummary } from '@/lib/data/returns';
import { EMPTY_PAYOUT, type Payout, peso, RETURN_REASONS, reasonOf } from '@/lib/returns-policy';

type Choice = { line_item_id: string; quantity: number; reason: string };

const SELECT =
	'w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-[14px] outline-none focus:border-[#432C63]';

/**
 * A return or refund request, as the policy asks for it: which items and why,
 * the proof (photos with the waybill, and the unboxing video for damaged or
 * incomplete items), where to send the refund, and that the item is unused.
 */
export const OrderReturnSection = ({ order, cases = [] }: { order: any; cases?: ReturnCaseSummary[] }) => {
	const router = useRouter();
	// What this order has had already: one still open stops a new request, and an
	// item that was in a return can't be claimed again (the backend checks both)
	const openCase = cases.find((c) => c.open);
	const claimed = new Map(cases.flatMap((c) => c.items.map((i) => [i.line_item_id, c] as const)));
	const claimable = (order.items ?? []).filter((item: any) => !claimed.has(item.id));
	const [existing, setExisting] = useState<string | null>(null);
	const [step, setStep] = useState<1 | 2>(1);
	const [chosen, setChosen] = useState<Record<string, Choice>>({});
	const [evidence, setEvidence] = useState<Uploaded[]>([]);
	const [payout, setPayout] = useState<Payout>(EMPTY_PAYOUT);
	const [note, setNote] = useState('');
	const [confirmed, setConfirmed] = useState(false);
	const [error, setError] = useState('');
	const [sending, setSending] = useState(false);

	const items = Object.values(chosen);
	const reasons = useMemo(() => [...new Set(items.map((i) => i.reason).filter(Boolean))], [items]);
	const sendBack = reasons.some((r) => reasonOf(r)?.sendBack);
	const needVideo = reasons.some((r) => reasonOf(r)?.video);
	const onlyMissing = reasons.length > 0 && reasons.every((r) => r === 'not-received');

	const toggle = (item: any) =>
		setChosen((prev) => {
			const next = { ...prev };
			if (next[item.id]) delete next[item.id];
			else next[item.id] = { line_item_id: item.id, quantity: item.quantity, reason: '' };
			return next;
		});
	const update = (id: string, patch: Partial<Choice>) => setChosen((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

	const next = () => {
		setError('');
		if (!items.length) return setError('Choose the item that has a problem.');
		if (items.some((i) => !i.reason)) return setError('Say what is wrong with each item you chose.');
		setStep(2);
	};

	const submit = async () => {
		setError('');
		setSending(true);
		const result = await openReturn({
			condition_confirmed: confirmed,
			evidence: evidence.map((e) => e.id),
			items,
			note,
			order_id: order.id,
			payout,
		});
		setSending(false);
		if (!result.ok) {
			// Already asked (another tab, a second tap): point at that return
			if (result.request_id) setExisting(result.request_id);
			return setError(result.message);
		}
		router.push(`/user/orders/${result.request_id}/request-success`);
	};

	return (
		<div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-4 md:gap-8">
			<UserNavigation user={null} />
			<div className="mb-8 md:col-span-3 md:mb-0" data-testid="return-form" data-step={step}>
				<LocalizedClientLink className="text-[13px] font-medium text-[#432C63] underline" href={`/user/orders/${order.order_set?.id ?? order.id}`}>
					Back to the order
				</LocalizedClientLink>
				<h1 className="mt-4 text-[26px] font-semibold text-[#1B1B1B]">Ask for a return or refund</h1>
				<p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-black/65">
					Within 7 days of delivery, for a damaged, wrong, incomplete, not-as-described or expired item, or a parcel that never
					arrived. Change of mind isn&apos;t covered.{' '}
					<LocalizedClientLink className="text-[#432C63] underline" href="/returns-policy">
						How returns and refunds work
					</LocalizedClientLink>
				</p>

				{openCase || !claimable.length ? (
					<div className={`${account.panel} mt-6 flex max-w-2xl flex-col gap-4`} data-testid="return-already-asked">
						<div>
							<p className={account.panelTitle}>
								{openCase ? 'You already asked for a return on this order' : 'Everything in this order has been in a return'}
							</p>
							<p className={account.panelText}>
								{openCase
									? `It is still open: ${openCase.stage_label.toLowerCase()}. One return at a time per order; follow this one, and once it's over you can ask about any other item.`
									: 'Each item can be claimed once. See what was decided on your return.'}
							</p>
						</div>
						<div className="flex flex-wrap gap-3">
							<LocalizedClientLink className={account.primaryButton} href={`/user/returns?return=${(openCase ?? cases[0])?.request_id ?? ''}`}>
								{openCase ? 'Follow your return' : 'See your return'}
							</LocalizedClientLink>
							<LocalizedClientLink className={account.outlineButton} href={`/user/orders/${order.order_set?.id ?? order.id}`}>
								Back to the order
							</LocalizedClientLink>
						</div>
					</div>
				) : (
				<>
				<ol className="mt-5 flex gap-4 text-[13px]">
					<li className={step === 1 ? 'font-semibold text-[#432C63]' : 'text-black/50'}>1. Items and reason</li>
					<li className={step === 2 ? 'font-semibold text-[#432C63]' : 'text-black/50'}>2. Proof and refund</li>
				</ol>

				{step === 1 ? (
					<div className="mt-4 flex flex-col gap-3">
						{(order.items ?? []).map((item: any) => {
							const pick = chosen[item.id];
							const before = claimed.get(item.id);
							if (before) {
								return (
									<div className="flex items-center gap-3 rounded-xl border border-black/10 bg-[#FAF8F5] p-4 opacity-80" data-testid="return-item-claimed" key={item.id}>
										<span className="size-14 shrink-0 overflow-hidden rounded-md border bg-black/[0.03]">
											{item.thumbnail && <Image alt="" height={56} src={item.thumbnail} width={56} />}
										</span>
										<span className="min-w-0 flex-1">
											<span className="block truncate text-[14px] font-medium">{item.product_title || item.title}</span>
											<span className="block text-[13px] text-black/55">Already in a return: {before.stage_label.toLowerCase()}</span>
										</span>
									</div>
								);
							}
							return (
								<div className="rounded-xl border border-black/10 bg-white p-4" key={item.id}>
									<label className="flex cursor-pointer items-center gap-3">
										<input checked={!!pick} className="size-4 accent-[#432C63]" onChange={() => toggle(item)} type="checkbox" />
										<span className="size-14 shrink-0 overflow-hidden rounded-md border bg-black/[0.03]">
											{item.thumbnail && <Image alt="" height={56} src={item.thumbnail} width={56} />}
										</span>
										<span className="min-w-0 flex-1">
											<span className="block truncate text-[14px] font-medium">{item.product_title || item.title}</span>
											<span className="block text-[13px] text-black/55">
												{item.variant_title ? `${item.variant_title} · ` : ''}
												{item.quantity} × {peso(item.unit_price)}
											</span>
										</span>
									</label>
									{pick && (
										<div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px]">
											<label className="flex flex-col gap-1 text-[13px]">
												What&apos;s wrong?
												<select
													aria-label={`Reason for ${item.product_title || item.title}`}
													className={SELECT}
													onChange={(e) => update(item.id, { reason: e.target.value })}
													value={pick.reason}
												>
													<option value="">Choose a reason</option>
													{RETURN_REASONS.map((r) => (
														<option key={r.code} value={r.code}>
															{r.label}
														</option>
													))}
												</select>
												{pick.reason && <span className="text-[12px] text-black/50">{reasonOf(pick.reason)?.hint}</span>}
											</label>
											<label className="flex flex-col gap-1 text-[13px]">
												How many
												<select
													className={SELECT}
													onChange={(e) => update(item.id, { quantity: Number(e.target.value) })}
													value={pick.quantity}
												>
													{Array.from({ length: item.quantity }, (_, i) => i + 1).map((n) => (
														<option key={n}>{n}</option>
													))}
												</select>
											</label>
										</div>
									)}
								</div>
							);
						})}
						{error && (
							<p className="text-[13px] text-red-600" role="alert">
								{error}{' '}
								{existing && (
									<LocalizedClientLink className="font-medium text-[#432C63] underline" href={`/user/returns?return=${existing}`}>
										Follow your return
									</LocalizedClientLink>
								)}
							</p>
						)}
						<div>
							<button className="rounded-lg bg-[#432C63] px-5 py-2.5 text-[14px] font-medium text-white" onClick={next} type="button">
								Continue
							</button>
						</div>
					</div>
				) : (
					<div className="mt-4 flex max-w-2xl flex-col gap-6 rounded-xl border border-black/10 bg-white p-5">
						{!onlyMissing && <EvidenceUploader needVideo={needVideo} onChange={setEvidence} value={evidence} />}
						<label className="flex flex-col gap-1 text-[13px]">
							Anything else the seller should know? (optional)
							<textarea
								className="min-h-20 rounded-lg border border-black/15 px-3 py-2 text-[14px] outline-none focus:border-[#432C63]"
								maxLength={1000}
								onChange={(e) => setNote(e.target.value)}
								value={note}
							/>
						</label>
						<RefundAccountFields onChange={setPayout} value={payout} />
						{sendBack && (
							<label className="flex items-start gap-2 text-[13px] leading-relaxed">
								<input checked={confirmed} className="mt-0.5 size-4 accent-[#432C63]" onChange={(e) => setConfirmed(e.target.checked)} type="checkbox" />
								The item is unused, and I still have all its packaging, tags, manuals and freebies to send back with it.
							</label>
						)}
						<div className="rounded-lg bg-[#F6F2FB] px-4 py-3 text-[13px] leading-relaxed text-black/70">
							The seller has 48 hours to answer. If they approve a return, you send it back within 5 days and we refund the item
							and the original delivery fee, plus your return postage. Refunds take 7–14 business days for online payments and
							3–5 for cash on delivery.
						</div>
						{error && (
							<p className="text-[13px] text-red-600" role="alert">
								{error}{' '}
								{existing && (
									<LocalizedClientLink className="font-medium text-[#432C63] underline" href={`/user/returns?return=${existing}`}>
										Follow your return
									</LocalizedClientLink>
								)}
							</p>
						)}
						<div className="flex gap-3">
							<button className="rounded-lg border border-black/15 px-4 py-2.5 text-[14px]" onClick={() => setStep(1)} type="button">
								Back
							</button>
							<button
								className="rounded-lg bg-[#432C63] px-5 py-2.5 text-[14px] font-medium text-white disabled:opacity-60"
								data-testid="return-submit"
								disabled={sending}
								onClick={submit}
								type="button"
							>
								{sending ? 'Sending…' : 'Send request'}
							</button>
						</div>
					</div>
				)}
				</>
				)}
			</div>
		</div>
	);
};
