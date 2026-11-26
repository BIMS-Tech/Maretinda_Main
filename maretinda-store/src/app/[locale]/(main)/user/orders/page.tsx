import { isEmpty } from 'lodash';
import { redirect } from 'next/navigation';

import { ParcelAccordion } from '@/components/molecules';
import { Layout } from '@/components/organisms';
import { AccountEmpty, AccountHeading } from '@/components/organisms/Layout/AccountHeading';
import { OrdersPagination } from '@/components/sections';
import { retrieveCustomer } from '@/lib/data/customer';
import { listOrders } from '@/lib/data/orders';

const LIMIT = 10;

export default async function UserPage({
	searchParams,
}: {
	searchParams: Promise<{ page: string }>;
}) {
	const user = await retrieveCustomer();

	if (!user) {
		redirect('/login');
	}

	const orders = await listOrders();

	const { page } = await searchParams;

	const pages = Math.ceil(orders.length / LIMIT);
	const currentPage = +page || 1;
	const offset = (+currentPage - 1) * LIMIT;

	const orderSetsGrouped = orders.reduce(
		(acc, order) => {
			const orderSetId = (order as any).order_set.id;
			if (!acc[orderSetId]) {
				acc[orderSetId] = [];
			}
			acc[orderSetId].push(order);
			return acc;
		},
		{} as Record<string, typeof orders>,
	);

	const orderSets = Object.entries(orderSetsGrouped).map(
		([orderSetId, orders]) => {
			const firstOrder = orders[0];
			const orderSet = (firstOrder as any).order_set;

			return {
				created_at: orderSet.created_at,
				currency_code: firstOrder.currency_code,
				display_id: orderSet.display_id,
				id: orderSetId,
				orders: orders,
				total: orders.reduce((sum, order) => sum + order.total, 0),
			};
		},
	);

	const processedOrders = orderSets.slice(offset, offset + LIMIT);

	return (
		<Layout>
			<div className="md:col-span-3 user-content-wrapper">
				<AccountHeading note="Follow what is on its way, and find anything you bought before." title="Orders" />
				{isEmpty(orders) ? (
					<AccountEmpty
						action="Start shopping"
						href="/search?sort=popular"
						icon={
							<svg aria-hidden="true" fill="none" height="30" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24" width="30">
								<path d="M21 8.500l-9-5-9 5v7l9 5 9-5v-7zM3.300 8.700L12 13.500l8.700-4.800M12 13.500V21" />
							</svg>
						}
						title="No orders yet"
					>
						Once you place an order, it will appear here.
					</AccountEmpty>
				) : (
					<>
						<div className="w-full max-w-full">
							<div className="flex flex-col gap-6">
								{processedOrders.map((orderSet) => (
									<ParcelAccordion
										createdAt={orderSet.created_at}
										currency_code={orderSet.currency_code}
										key={orderSet.id}
										orderDisplayId={`#${orderSet.display_id}`}
										orderId={orderSet.id}
										orders={orderSet.orders || []}
										total={orderSet.total}
									/>
								))}
							</div>
						</div>
						{/* TODO - pagination */}
						<OrdersPagination pages={pages} />
					</>
				)}
			</div>
		</Layout>
	);
}
