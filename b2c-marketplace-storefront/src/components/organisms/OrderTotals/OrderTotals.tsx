import { Card, Divider } from '@/components/atoms';
import { convertToLocale } from '@/lib/helpers/money';

export const OrderTotals = ({ orderSet }: { orderSet: any }) => {
	const subtotal = orderSet.orders.reduce((acc: number, order: any) => {
		return acc + order.item_subtotal;
	}, 0);

	const delivery = orderSet.shipping_total;
	const total = subtotal + delivery;

	const currency_code = orderSet.payment_collection.currency_code;

	return (
		<Card className="p-3 sm:!p-6 user-content-wrapper mt-12">
			<p className="text-primary label-lg !font-normal mb-4 flex justify-between">
				Subtotal:
				<span className="font-bold">
					{convertToLocale({
						amount: subtotal,
						currency_code,
					})}
				</span>
			</p>
			<p className="text-primary label-lg !font-normal mb-4 flex justify-between">
				Delivery:
				<span className="font-bold">
					{convertToLocale({
						amount: delivery,
						currency_code,
					})}
				</span>
			</p>
			<p className="text-primary label-lg !font-normal flex justify-between">
				Coupon Discount::
				<span className="font-bold">
					{convertToLocale({
						amount: 0,
						currency_code,
					})}
				</span>
			</p>
			<Divider className="my-8" />
			<p className="text-primary label-xl !font-bold flex justify-between items-center">
				Total:{' '}
				<span>
					{convertToLocale({
						amount: total,
						currency_code,
					})}
				</span>
			</p>
		</Card>
	);
};
