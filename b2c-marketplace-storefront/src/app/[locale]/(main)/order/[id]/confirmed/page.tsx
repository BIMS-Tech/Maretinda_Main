import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { OrderConfirmedSection } from '@/components/sections/OrderConfirmedSection/OrderConfirmedSection';
import { retrieveOrder, retrieveOrderSet } from '@/lib/data/orders';

type Props = {
	params: Promise<{ id: string }>;
};
export const metadata: Metadata = {
	description: 'You purchase was successful',
	title: 'Order Confirmed',
};

export default async function OrderConfirmedPage(props: Props) {
	const params = await props.params;
	
	// Check if this is an order set or individual order
	const isOrderSet = params.id.startsWith('ordset_');
	
	let order = null;
	
	if (isOrderSet) {
		// For order sets (marketplace with multiple vendors), get the order set
		const orderSet = await retrieveOrderSet(params.id).catch(() => null);
		
		if (orderSet?.orders && orderSet.orders.length > 0) {
			// Use the first order for display
			// In a marketplace, the OrderConfirmedSection should handle displaying all orders
			order = orderSet.orders[0];
			// Attach the full order set for reference
			order.order_set = orderSet;
		}
	} else {
		// Individual order (single vendor)
		order = await retrieveOrder(params.id).catch(() => null);
	}

	if (!order) {
		return notFound();
	}

	return (
		<main className="container !max-w-7xl mx-auto">
			<OrderConfirmedSection order={order} />
		</main>
	);
}
