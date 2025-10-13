import { OrderProductListItem } from '@/components/cells';

export const OrderParcelItems = ({
	items,
	currency_code,
}: {
	items: any[];
	currency_code: string;
}) => {
	return (
		<>
			{items.map((item) => (
				<OrderProductListItem
					currency_code={currency_code}
					item={item}
					key={item.id + item.variant_id}
				/>
			))}
		</>
	);
};
