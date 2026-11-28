import { Avatar } from '@/components/atoms';
import { OrderRefunds } from '@/components/cells/OrderRefunds/OrderRefunds';
import { OrderParcelActions } from '@/components/molecules/OrderParcelActions/OrderParcelActions';
import { OrderParcelItems } from '@/components/molecules/OrderParcelItems/OrderParcelItems';
import { OrderParcelStatus } from '@/components/molecules/OrderParcelStatus/OrderParcelStatus';
import { OrderTracking } from '@/components/molecules/OrderTracking/OrderTracking';
import { account } from '@/lib/account-styles';
import { retrieveCustomer } from '@/lib/data/customer';
import { getReturns } from '@/lib/data/orders';

import { Chat } from '../Chat/Chat';

export const OrderParcels = async ({ orders }: { orders: any[] }) => {
	const user = await retrieveCustomer();
	// The buyer's return requests, to show each order's next to it
	const returns: any[] = await getReturns()
		.then((r: any) => r?.order_return_requests ?? [])
		.catch(() => []);
	const latestReturn = (orderId: string) =>
		returns
			.filter((r) => (r.order?.id ?? r.order_id) === orderId)
			.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

	return (
		<>
			{orders.map((order, index) => (
				<article className={`${account.card} mb-8`} data-testid="parcel" key={order.id}>
					<header className={`${account.cardHead} flex flex-wrap items-center justify-between gap-3`}>
						<div className="flex min-w-0 items-center gap-3">
							<Avatar
								className="!size-10 shrink-0 !rounded-full bg-[#EAE5F0]"
								src={order.seller.photo}
							/>
							<div className="min-w-0">
								<p className={account.eyebrow}>
									{orders.length > 1 ? `Parcel ${index + 1} of ${orders.length} · from` : 'From'}
								</p>
								<p className={`${account.title} truncate`}>{order.seller.name}</p>
							</div>
						</div>
						<Chat
							buttonClassNames={`${account.outlineButton} !h-auto !normal-case`}
							order_id={order.id}
							seller={order.seller}
							user={user}
							variant="tonal"
						/>
					</header>
					<div className="px-4 py-6 sm:px-6">
						<OrderParcelStatus order={order} />
						<div className="pt-4">
							<OrderTracking orderId={order.id} />
						</div>
						<div className="mt-6 border-t border-[#EAE5F0] pt-6">
							<OrderParcelItems
								currency_code={order.currency_code}
								items={order.items}
							/>
						</div>
						<div className="pb-2">
							<a
								className="text-[13px] font-medium text-[#432C63] underline underline-offset-2 hover:text-[#372248]"
								download
								href={`/api/orders/${order.id}/invoice`}
							>
								Download order summary (PDF)
							</a>
						</div>
						<div className="pt-5">
							<OrderParcelActions order={order} returnRequest={latestReturn(order.id)} />
							<OrderRefunds orderId={order.id} />
						</div>
					</div>
				</article>
			))}
		</>
	);
};
