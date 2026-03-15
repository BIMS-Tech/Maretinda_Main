import type { HttpTypes } from '@medusajs/types';

import { CartItemsProducts } from '@/components/cells';

export const CartItems = ({ cart }: { cart: HttpTypes.StoreCart | null }) => {
	if (!cart || !cart.items || cart.items.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-gray-500 text-lg">Your shopping cart is empty</p>
			</div>
		);
	}

	const groupedItems: any = groupItemsBySeller(cart);

	// Flatten all items for a unified table view
	const allItems = Object.keys(groupedItems).flatMap((key) => {
		const items = groupedItems[key].items || [];
		const seller = groupedItems[key]?.seller;
		return items.map((item: any) => ({
			...item,
			vendorName: seller?.name || 'Maretinda',
		}));
	});

	return (
		<CartItemsProducts
			currency_code={cart.currency_code}
			products={allItems}
		/>
	);
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
