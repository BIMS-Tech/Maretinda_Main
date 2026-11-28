import { format } from 'date-fns';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { account } from '@/lib/account-styles';
import { convertToLocale } from '@/lib/helpers/money';

import { ParcelAccordionItems } from './ParcelAccordionItems';

/** One checkout on the Orders list: its number, date and total, then a row per shop. */
export const ParcelAccordion = ({
	orderId,
	orderDisplayId,
	createdAt,
	total,
	currency_code = 'php',
	orders,
}: {
	orderId: string;
	orderDisplayId: string;
	createdAt: string | Date;
	total: number;
	currency_code?: string;
	orders: any[];
	defaultOpen?: boolean;
}) => (
	<article className={account.card} data-testid="order-card">
		<header className={`${account.cardHead} flex flex-wrap items-center gap-x-8 gap-y-3`}>
			<div>
				<p className={account.eyebrow}>Order</p>
				<p className={account.title}>{orderDisplayId}</p>
			</div>
			<div>
				<p className={account.eyebrow}>Placed</p>
				<p className="text-[14px] text-[#1B1B1B]">{createdAt && !Number.isNaN(new Date(createdAt).getTime()) ? format(new Date(createdAt), 'd MMM yyyy') : '—'}</p>
			</div>
			<div>
				<p className={account.eyebrow}>Total</p>
				<p className="text-[14px] font-semibold text-[#1B1B1B]">{convertToLocale({ amount: total, currency_code })}</p>
			</div>
			<LocalizedClientLink className={`${account.primaryButton} ml-auto`} href={`/user/orders/${orderId}`}>
				View order
				<svg aria-hidden="true" fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24" width="14">
					<path d="M5 12h14M13 5l7 7-7 7" />
				</svg>
			</LocalizedClientLink>
		</header>
		<ul className="divide-y divide-[#EAE5F0]">
			{orders.map((order) => (
				<ParcelAccordionItems currency_code={currency_code} key={order.id} order={order} orderId={orderId} />
			))}
		</ul>
	</article>
);
