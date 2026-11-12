import { OrderCancel } from '@/components/cells/OrderCancel/OrderCancel';
import { OrderReturn } from '@/components/cells/OrderReturn/OrderReturn';

export const OrderParcelActions = ({ order }: { order: any }) => {
	// Until the seller starts on it; the backend makes the final call
	if (
		order.status !== 'canceled' &&
		(!order.fulfillment_status ||
			order.fulfillment_status === 'not_fulfilled')
	) {
		return <OrderCancel order={order} />;
	}
	// Delivered orders stay "pending" until the seller completes them by hand,
	// so a buyer couldn't return anything they had received
	if (order.status === 'completed' || order.fulfillment_status === 'delivered') {
		return <OrderReturn order={order} />;
	}
	return null;
};
