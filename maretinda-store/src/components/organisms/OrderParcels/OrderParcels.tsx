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
				<div
					className="w-full mb-8 shadow-[0px_4px_6px_-6px_rgba(0,_0,_0,_0.25)] border rounded-t-[23px] rounded-b-sm overflow-hidden border-black/15"
					key={order.id}
				>
					<div className="text-base font-bold text-primary border-b border-b-black/15 bg-brandPurpleLighten py-4 px-6 gap-5 md:gap-10 w-full shadow">
						Order {index + 1}
					</div>
					<div className="py-8 px-3 sm:px-5">
						<div className="">
							<OrderParcelStatus order={order} />
						</div>
						<div className="pt-8 pb-6 border-b md:flex items-center justify-between">
							<div className="flex items-center gap-4 mb-4 md:mb-0">
								<Avatar
									className="bg-[#FFEDD5] !rounded-full !w-[60px] !h-[60px]"
									src={order.seller.photo}
								/>
								<p className="text-primary label-xl !font-semibold">
									{order.seller.name}
								</p>
							</div>
							<Chat
								buttonClassNames="text-[13px] !font-medium flex items-center gap-2 py-2.5"
								order_id={order.id}
								seller={order.seller}
								user={user}
								variant="filled"
							/>
						</div>
						<div className="py-6">
							<OrderParcelItems
								currency_code={order.currency_code}
								items={order.items}
							/>
						</div>
						<div className="pt-4 pb-0">
							<OrderParcelActions order={order} />
						</div>
					</div>
				</div>
			))}
		</>
	);
};
