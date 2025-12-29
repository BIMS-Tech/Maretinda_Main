import { isEmpty } from 'lodash';
import { redirect } from 'next/navigation';

import { ParcelAccordion } from '@/components/molecules';
import { Layout } from '@/components/organisms';
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
			<div className="md:col-span-3 space-y-10 user-content-wrapper">
				<div className="flex flex-col gap-4 justify-start">
					<h1 className="text-3xl capitalize text-black font-lora !font-bold">
						Orders
					</h1>
					<p>View and track all your recent purchases</p>
				</div>
				{isEmpty(orders) ? (
					<div className="text-center">
						<h3 className="heading-lg text-primary uppercase">
							No orders
						</h3>
						<p className="text-lg text-secondary mt-2">
							You haven&apos;t placed any order yet. Once you
							place an order, it will appear here.
						</p>
					</div>
				) : (
					<>
						<div className="w-full max-w-full">
							<div className="flex flex-col gap-8">
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
