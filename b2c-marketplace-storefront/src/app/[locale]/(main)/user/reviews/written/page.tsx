import { LoginForm } from '@/components/molecules';
import { Layout, ReviewsWritten } from '@/components/organisms';
import { retrieveCustomer } from '@/lib/data/customer';
import { listOrders } from '@/lib/data/orders';
import { getReviews } from '@/lib/data/reviews';

export default async function Page() {
	const user = await retrieveCustomer();

	const { reviews } = await getReviews();
	const orders = await listOrders();

	if (!user) return <LoginForm />;

	return (
		<Layout>
			<ReviewsWritten
				orders={orders.filter((order) => order.reviews.length)}
				reviews={reviews.filter(Boolean)}
			/>
		</Layout>
	);
}
