import { Avatar } from '@/components/atoms';
import { OrderParcelActions } from '@/components/molecules/OrderParcelActions/OrderParcelActions';
import { OrderParcelItems } from '@/components/molecules/OrderParcelItems/OrderParcelItems';
import { OrderParcelStatus } from '@/components/molecules/OrderParcelStatus/OrderParcelStatus';
import { retrieveCustomer } from '@/lib/data/customer';

import { Chat } from '../Chat/Chat';

export const OrderParcels = async ({ orders }: { orders: any[] }) => {
	const user = await retrieveCustomer();

	return (
		<>
			{orders.map((order, index) => (
				<div className="w-full mb-8" key={order.id}>
					<div className="border rounded-sm p-4 bg-component-secondary font-semibold text-secondary uppercase">
						Parcel {index + 1}
					</div>
					<div className="border rounded-sm">
						<div className="p-4 border-b">
							<OrderParcelStatus order={order} />
						</div>
						<div className="p-4 border-b md:flex items-center justify-between">
							<div className="flex items-center gap-4 mb-4 md:mb-0">
								<Avatar src={order.seller.photo} />
								<p className="text-primary">
									{order.seller.name}
								</p>
							</div>
							<Chat
								buttonClassNames="label-md text-action-on-secondary uppercase flex items-center gap-2"
								order_id={order.id}
								seller={order.seller}
								user={user}
							/>
						</div>
						<div className="p-4 border-b">
							<OrderParcelItems
								currency_code={order.currency_code}
								items={order.items}
							/>
						</div>
						<div className="p-4">
							<OrderParcelActions order={order} />
						</div>
					</div>
				</div>
			))}
		</>
	);
};
