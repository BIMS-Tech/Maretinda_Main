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
				orders={orders.filter((order) => order.reviews.length === 0)}
			/>
		</Layout>
	);
}
