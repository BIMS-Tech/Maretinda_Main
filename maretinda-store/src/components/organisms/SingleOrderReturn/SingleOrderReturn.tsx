'use client';

import { format } from 'date-fns';
import Image from 'next/image';
import { useState } from 'react';

import { Avatar } from '@/components/atoms';
import { ReturnCasePanel } from '@/components/cells/ReturnCasePanel/ReturnCasePanel';
import { CollapseIcon } from '@/icons';
import { account } from '@/lib/account-styles';
import { convertToLocale } from '@/lib/helpers/money';
import { RETURN_STATUS_LABELS } from '@/lib/returns-policy';
import { cn } from '@/lib/utils';

import { Chat } from '../Chat/Chat';

const TONE: Record<string, string> = {
	canceled: 'bg-black/[0.05] text-black/60',
	escalated: 'bg-[#FFF4D6] text-[#7A5B00]',
	pending: 'bg-[#F6F2FB] text-[#432C63]',
	refunded: 'bg-[#E7F5EC] text-[#1F7A4D]',
	withdrawn: 'bg-[#FDE8E6] text-[#B3261E]',
};

/**
 * One return on the Returns page: the order, what is going back and why, and
 * the case with its next step and deadline. Opens without measuring its
 * height, so the case can load in after it without being cut off.
 */
export const SingleOrderReturn = ({
	item,
	user,
	defaultOpen,
}: {
	item: any;
	user: any;
	defaultOpen: boolean;
}) => {
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const order = item.order ?? {};
	const currency_code = order.currency_code || 'php';

	const returned = (item.line_items ?? [])
		.map((line: any) => ({ line, orderItem: (order.items ?? []).find((o: any) => o.id === line.line_item_id) }))
		.filter((r: any) => r.orderItem);
	const count = returned.reduce((n: number, r: any) => n + Number(r.line.quantity ?? 1), 0);
	const total = returned.reduce((sum: number, r: any) => sum + Number(r.orderItem.unit_price ?? 0) * Number(r.line.quantity ?? 1), 0);
	const asked = new Date(item.created_at ?? item.line_items?.[0]?.created_at ?? NaN);
	const askedOn = Number.isNaN(asked.getTime()) ? null : asked;

	return (
		<article className={`${account.card} mb-5`} data-status={item.status} data-testid="return-card">
			<button
				aria-expanded={isOpen}
				className={cn(account.cardHead, 'flex w-full flex-wrap items-center gap-x-8 gap-y-2 text-left', !isOpen && 'border-b-0')}
				onClick={() => setIsOpen(!isOpen)}
				type="button"
			>
				<span>
					<span className={`${account.eyebrow} block`}>Return · Order</span>
					<span className={account.title}>#{order.display_id}</span>
				</span>
				<span>
					<span className={`${account.eyebrow} block`}>Asked</span>
					<span className="text-[14px] text-[#1B1B1B]">{askedOn ? format(askedOn, 'd MMM yyyy') : '—'}</span>
				</span>
				<span>
					<span className={`${account.eyebrow} block`}>{count === 1 ? '1 item' : `${count} items`}</span>
					<span className="text-[14px] font-semibold text-[#1B1B1B]">{convertToLocale({ amount: total, currency_code })}</span>
				</span>
				<span className="ml-auto flex items-center gap-3">
					<span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${TONE[item.status] ?? TONE.pending}`}>
						{RETURN_STATUS_LABELS[item.status] ?? item.status}
					</span>
					<CollapseIcon className={cn('size-5 text-[#432C63] transition-transform duration-300', isOpen && 'rotate-180')} />
				</span>
			</button>

			{isOpen && (
				<div className="divide-y divide-[#EAE5F0]">
					<ReturnCasePanel requestId={item.id} />
					<ul className="flex flex-col gap-4 px-5 py-5 sm:px-6">
						{returned.map(({ line, orderItem }: any) => (
							<li className="flex items-center gap-4" key={line.id}>
								<span className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-[#EAE5F0] bg-[#FAF8F5]">
									{orderItem.thumbnail ? (
										<Image alt="" className="object-cover" fill sizes="56px" src={orderItem.thumbnail} />
									) : (
										<Image alt="" className="scale-50 opacity-25" fill src="/images/placeholder.svg" />
									)}
								</span>
								<span className="min-w-0 flex-1">
									<span className="block truncate text-[15px] font-medium text-[#1B1B1B]">{orderItem.product_title}</span>
									{orderItem.variant_title && <span className="block text-[13px] text-black/55">{orderItem.variant_title}</span>}
								</span>
								<span className="text-right text-[14px] text-[#1B1B1B]">
									{Number(line.quantity ?? 1)} × {convertToLocale({ amount: orderItem.unit_price, currency_code })}
								</span>
							</li>
						))}
						{item.customer_note && (
							<li className="rounded-lg bg-[#FAF8F5] px-4 py-3 text-[13px] text-black/70">
								<span className="font-semibold text-[#1B1B1B]">Your reason: </span>
								{item.customer_note}
							</li>
						)}
					</ul>
					{order.seller && (
						<div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
							<span className="flex items-center gap-3">
								<Avatar className="!size-9 !rounded-full bg-[#EAE5F0]" src={order.seller.photo || '/talkjs-placeholder.jpg'} />
								<span className="text-[15px] font-medium text-[#1B1B1B]">{order.seller.name}</span>
							</span>
							<Chat
								buttonClassNames={`${account.outlineButton} !h-auto !normal-case`}
								order_id={order.id}
								seller={order.seller}
								user={user}
							/>
						</div>
					)}
				</div>
			)}
		</article>
	);
};
