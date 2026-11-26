import type { HttpTypes } from '@medusajs/types';

import { CartItemsProducts } from '@/components/cells';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';

export const CartItems = ({ cart }: { cart: HttpTypes.StoreCart | null }) => {
	if (!cart || !cart.items || cart.items.length === 0) {
		return (
			<div className="rise-in flex flex-col items-center py-16 text-center">
				<span className="pop-in mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#F6F2FB] text-[#432C63]">
					<svg aria-hidden="true" fill="none" height="34" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 24 24" width="34">
						<circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.050 2.050h2l2.660 12.420a2 2 0 0 0 2 1.580h9.780a2 2 0 0 0 1.950-1.570l1.650-7.430H5.120" />
					</svg>
				</span>
				<p className="text-[17px] font-bold text-[#1B1B1B]">Your shopping cart is empty</p>
				<p className="mt-1 text-[13.5px] text-[#737373]">Find something you love: it'll wait for you here.</p>
				<LocalizedClientLink className="press mt-6 inline-flex h-12 items-center rounded-full bg-[#432C63] px-7 text-[14px] font-bold text-white" href="/search?sort=popular">
					Start shopping
				</LocalizedClientLink>
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
			sellerName: seller?.name || 'Maretinda',
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
