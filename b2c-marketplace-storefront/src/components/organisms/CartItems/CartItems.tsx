import type { HttpTypes } from '@medusajs/types';

import {
	CartItemsFooter,
	CartItemsHeader,
	CartItemsProducts,
} from '@/components/cells';

export const CartItems = ({ cart }: { cart: HttpTypes.StoreCart | null }) => {
	if (!cart) return null;

	const groupedItems: any = groupItemsBySeller(cart);

	return Object.keys(groupedItems).map((key) => (
		<div className="mb-4" key={key}>
			<CartItemsHeader seller={groupedItems[key]?.seller} />
			<CartItemsProducts
				currency_code={cart.currency_code}
				products={groupedItems[key].items || []}
			/>
			<CartItemsFooter
				currency_code={cart.currency_code}
				price={cart.shipping_total}
			/>
		</div>
	));
};

function groupItemsBySeller(cart: HttpTypes.StoreCart) {
	const groupedBySeller: any = {};

	cart.items?.forEach((item: any) => {
		const seller = item.product?.seller;
		if (seller) {
			if (!groupedBySeller[seller.id]) {
				groupedBySeller[seller.id] = {
					items: [],
					seller: seller,
				};
			}
			groupedBySeller[seller.id].items.push(item);
		} else {
			if (!groupedBySeller['maretinda']) {
				groupedBySeller['maretinda'] = {
					items: [],
					seller: {
						created_at: new Date(),
						id: 'maretinda',
						name: 'Maretinda',
						photo: '/Logo.png',
					},
				};
			}
			groupedBySeller['maretinda'].items.push(item);
		}
	});

	return groupedBySeller;
}
