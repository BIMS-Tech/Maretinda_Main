import { OrderProductListItem } from '@/components/cells';

export const OrderParcelItems = ({
	items,
	currency_code,
}: {
	items: any[];
	currency_code: string;
}) => {
	console.log(items);
	return (
		<>
			{items.map((item, index) => (
				<OrderProductListItem
					currency_code={currency_code}
					item={item}
					key={item.id + item.variant_id}
					withDivider={index !== items.length - 1}
				/>
			))}
		</>
	);
};
