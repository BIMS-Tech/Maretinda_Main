import { format } from 'date-fns';

import { OrderCancel } from '@/components/cells/OrderCancel/OrderCancel';
import { OrderReturn } from '@/components/cells/OrderReturn/OrderReturn';
import { RequestCancellation } from '@/components/cells/RequestCancellation/RequestCancellation';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { account } from '@/lib/account-styles';
import { RETURN_STATUS_LABELS } from '@/lib/returns-policy';

/** Paid through GiyaPay: cancelling means a refund, so it goes through a request. */
const paidOnline = (order: any) =>
	(order.payment_collections ?? []).some((pc: any) =>
		(pc.payments ?? []).some((p: any) => /giyapay/i.test(p.provider_id ?? '')),
	);

/** A return already asked for on this order: where it stands, and the way to follow it. */
/** When a return was asked for: the store's list leaves the request's own date out, its lines carry it. */
export const askedAt = (request: any): Date | null => {
	const d = new Date(request?.created_at ?? request?.line_items?.[0]?.created_at ?? NaN);
	return Number.isNaN(d.getTime()) ? null : d;
};

const ReturnRequested = ({ request }: { request: any }) => {
	const items = (request.line_items ?? []).reduce((n: number, l: any) => n + Number(l.quantity ?? 1), 0);
	const asked = askedAt(request);
	return (
		<div className={`${account.panel} flex flex-col gap-4 md:flex-row md:items-center md:justify-between`} data-testid="return-requested">
			<div>
				<p className={account.panelTitle}>
					Return {RETURN_STATUS_LABELS[request.status]?.toLowerCase() ?? request.status}
				</p>
				<p className={account.panelText}>
					You asked to return {items} {items === 1 ? 'item' : 'items'}
					{asked ? ` on ${format(asked, 'd MMM yyyy')}` : ''}. Follow it, answer the seller or send it back from your
					return.
				</p>
			</div>
			<LocalizedClientLink className={account.primaryButton} href={`/user/returns?return=${request.id}`}>
				Follow your return
			</LocalizedClientLink>
		</div>
	);
};

export const OrderParcelActions = ({ order, returnRequest }: { order: any; returnRequest?: any }) => {
	if (returnRequest) return <ReturnRequested request={returnRequest} />;
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
	if (
		order.status === 'completed' ||
		['delivered', 'shipped', 'partially_shipped', 'partially_delivered'].includes(order.fulfillment_status)
	) {
		return <OrderReturn order={order} />;
	}
	return null;
};
