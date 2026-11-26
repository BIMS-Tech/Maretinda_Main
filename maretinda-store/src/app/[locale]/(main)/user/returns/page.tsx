import { redirect } from 'next/navigation';

import { Layout } from '@/components/organisms';
import { AccountHeading } from '@/components/organisms/Layout/AccountHeading';
import { OrderReturnRequests } from '@/components/sections/OrderReturnRequests/OrderReturnRequests';
import { retrieveCustomer } from '@/lib/data/customer';
import { getReturns } from '@/lib/data/orders';

export default async function ReturnsPage({
	searchParams,
}: {
	searchParams: Promise<{ page: string; return: string }>;
}) {
	const user = await retrieveCustomer();
	if (!user) redirect('/login?returnTo=/user/returns');

	const { order_return_requests } = await getReturns();
	const { page, return: returnId } = await searchParams;

	return (
		<Layout>
			<div className="md:col-span-3 user-content-wrapper">
				<AccountHeading title="Returns" />
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
