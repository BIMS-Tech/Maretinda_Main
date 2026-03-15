// import { format } from 'date-fns';

import { Button } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';

// import { convertToLocale } from '@/lib/helpers/money';

import { convertToLocale } from '@/lib/helpers/money';

import { ParcelAccordionItems } from './ParcelAccordionItems';

export const ParcelAccordion = ({
	orderId,
	orderDisplayId,
	createdAt,
	total,
	currency_code = 'eur',
	orders,
}: {
	orderId: string;
	orderDisplayId: string;
	createdAt: string | Date;
	total: number;
	currency_code?: string;
	orders: any[];
	defaultOpen?: boolean;
}) => {
	return (
		<div className="shadow-[0px_4px_6px_-6px_rgba(0,_0,_0,_0.25)] border rounded-t-[23px] rounded-b-sm overflow-hidden border-black/15">
			<div className="flex flex-col sm:flex-row ms:items-center text-secondary border-b border-b-black/15 bg-brandPurpleLighten py-4 px-6 gap-5 md:gap-10 w-full">
				<div className="flex-1 w-full flex flex-col lg:flex-row lg:items-center gap-0.5 lg:gap-4">
					<div className="flex justify-start lg:w-[22%]">
						<h2 className="label-lg text-black">
							{/* ORDER {orderDisplayId} */}
							Order ID
						</h2>
					</div>
					<div className="flex justify-start lg:w-[36%]">
						<h2 className="label-lg text-black">
							{/* Order date:{' '}
						<span className="text-primary lg:block xl:inline-block">
							{format(createdAt || '', 'yyyy-MM-dd')}
						</span> */}
							Product Name
						</h2>
					</div>
					<div className="flex lg:justify-end lg:w-[20%]">
						<h2 className="label-lg text-black">
							{/* Total:{' '}
						<span className="text-primary lg:block xl:inline-block">
							{convertToLocale({ amount: total, currency_code })}
						</span> */}
							Total Price
						</h2>
					</div>
					<div className="flex lg:justify-end lg:w-[20%]">
						<h2 className="label-lg text-black">Status</h2>
					</div>
				</div>

				<div className="lg:w-[14%] flex lg:justify-end items-center gap-4">
					<LocalizedClientLink href={`/user/orders/${orderId}`}>
						<Button className="min-w-[90px] capitalize text-[13px] !font-medium p-2.5">
							View Order
						</Button>
					</LocalizedClientLink>
				</div>
			</div>
			<div className="py-2">
				<ul className="w-full">
					{orders.map((order, index) => (
						<ParcelAccordionItems
							currency_code={currency_code}
							index={index + 1}
							key={order.id}
							order={order}
							orderDisplayId={orderDisplayId}
							totalPrice={convertToLocale({
								amount: total,
								currency_code,
							})}
						/>
					))}
				</ul>
			</div>
		</div>
	);
};
