import { Layout } from '@/components/organisms';
import { OrderReturnRequests } from '@/components/sections/OrderReturnRequests/OrderReturnRequests';
import { retrieveCustomer } from '@/lib/data/customer';
import { getReturns } from '@/lib/data/orders';

export default async function ReturnsPage({
	searchParams,
}: {
	searchParams: Promise<{ page: string; return: string }>;
}) {
	const { order_return_requests } = await getReturns();

	const user = await retrieveCustomer();

	const { page, return: returnId } = await searchParams;

	return (
		<Layout>
			<div className="md:col-span-3 user-content-wrapper">
				<h1 className="heading-md uppercase">Returns</h1>
				<OrderReturnRequests
					currentReturn={returnId || ''}
					page={page}
					returns={order_return_requests.sort((a, b) => {
						return (
							new Date(b.line_items[0].created_at).getTime() -
							new Date(a.line_items[0].created_at).getTime()
						);
					})}
					user={user}
				/>
			</div>
		</Layout>
	);
}
