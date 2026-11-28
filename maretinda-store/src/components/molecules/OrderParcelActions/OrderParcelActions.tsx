import { format } from 'date-fns';

import { OrderCancel } from '@/components/cells/OrderCancel/OrderCancel';
import { OrderReturn } from '@/components/cells/OrderReturn/OrderReturn';
import { RequestCancellation } from '@/components/cells/RequestCancellation/RequestCancellation';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { account } from '@/lib/account-styles';
import type { ReturnCaseSummary } from '@/lib/data/returns';

/** Paid through GiyaPay: cancelling means a refund, so it goes through a request. */
const paidOnline = (order: any) =>
	(order.payment_collections ?? []).some((pc: any) =>
		(pc.payments ?? []).some((p: any) => /giyapay/i.test(p.provider_id ?? '')),
	);

const validDate = (v: string | undefined) => {
	const d = new Date(v ?? NaN);
	return Number.isNaN(d.getTime()) ? null : d;
};

/** The order's latest return: where it stands, and the way to follow it. */
const ReturnRequested = ({ request }: { request: ReturnCaseSummary }) => {
	const items = request.items.reduce((n, i) => n + i.quantity, 0);
	const asked = validDate(request.created_at);
	const title = request.open ? 'Return in progress' : request.stage === 'refunded' ? 'Returned and refunded' : 'Return closed';
	return (
		<div
			className={`${account.panel} flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}
			data-open={request.open}
			data-testid="return-requested"
		>
			<div>
				<p className={account.panelTitle}>{title}</p>
				<p className={account.panelText}>
					{request.stage_label}. You asked to return {items} {items === 1 ? 'item' : 'items'}
					{asked ? ` on ${format(asked, 'd MMM yyyy')}` : ''}.
					{request.open ? ' One return at a time per order.' : ''}
				</p>
			</div>
			<LocalizedClientLink className={`${account.primaryButton} shrink-0`} href={`/user/returns?return=${request.request_id}`}>
				{request.open ? 'Follow your return' : 'See your return'}
			</LocalizedClientLink>
		</div>
	);
};

export const OrderParcelActions = ({ order, cases = [] }: { order: any; cases?: ReturnCaseSummary[] }) => {
	const latest = cases[0];
	// An open return comes first: no other request on this order until it's over
	if (latest?.open) return <ReturnRequested request={latest} />;

	// Until the seller starts on it; the backend makes the final call
	if (
		order.status !== 'canceled' &&
		// "canceled" here means its only parcel was un-packed (a cancelled courier booking)
		(!order.fulfillment_status ||
			['not_fulfilled', 'canceled'].includes(order.fulfillment_status))
	) {
		return paidOnline(order) ? <RequestCancellation order={order} /> : <OrderCancel order={order} />;
	}
	// Delivered orders stay "pending" until the seller completes them by hand,
	// so a buyer couldn't return anything they had received
	// Shipped but never arrived is a claim too ("Not received"); other reasons wait for delivery
	const returnable =
		order.status === 'completed' ||
		['delivered', 'shipped', 'partially_shipped', 'partially_delivered'].includes(order.fulfillment_status);
	// Each item can be claimed once; after a return, the others still can be
	const claimed = new Set(cases.flatMap((c) => c.items.map((i) => i.line_item_id)));
	const unclaimed = (order.items ?? []).some((item: any) => !claimed.has(item.id));

	return (
		<div className="flex flex-col gap-3">
			{latest && <ReturnRequested request={latest} />}
			{returnable && unclaimed && <OrderReturn another={!!latest} order={order} />}
		</div>
	);
};
