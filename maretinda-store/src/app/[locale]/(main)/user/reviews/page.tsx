import { redirect } from 'next/navigation';

import { Layout, ReviewsToWrite } from '@/components/organisms';
import { retrieveCustomer } from '@/lib/data/customer';
import { listOrders } from '@/lib/data/orders';

export default async function Page() {
	const user = await retrieveCustomer();

	if (!user) {
		redirect('/login');
	}

	const orders = await listOrders();

	if (!orders) return null;

	return (
		<Layout>
			<ReviewsToWrite
				// Only delivered orders can be reviewed (the backend refuses the rest)
				orders={orders.filter(
					(order: any) =>
						order.reviews.length === 0 &&
						order.status !== 'canceled' &&
						['delivered', 'partially_delivered'].includes(order.fulfillment_status),
				)}
			/>
		</Layout>
	);
}
