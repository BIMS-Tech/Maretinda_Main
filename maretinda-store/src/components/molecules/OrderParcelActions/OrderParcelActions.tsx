import { OrderCancel } from '@/components/cells/OrderCancel/OrderCancel';
import { OrderReturn } from '@/components/cells/OrderReturn/OrderReturn';
import { RequestCancellation } from '@/components/cells/RequestCancellation/RequestCancellation';

/** Paid through GiyaPay: cancelling means a refund, so it goes through a request. */
const paidOnline = (order: any) =>
	(order.payment_collections ?? []).some((pc: any) =>
		(pc.payments ?? []).some((p: any) => /giyapay/i.test(p.provider_id ?? '')),
	);

export const OrderParcelActions = ({ order }: { order: any }) => {
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
