'use client';

import type { HttpTypes } from '@medusajs/types';
import Image from 'next/image';

import { CartSummary } from '@/components/organisms';
import { UpdateCartItemButton } from '@/components/molecules/UpdateCartItemButton/UpdateCartItemButton';
import { convertToLocale } from '@/lib/helpers/money';

import PaymentButton from './PaymentButton';

const Review = ({ cart }: { cart: HttpTypes.StoreCart | null }) => {
	if (!cart) return null;

	const paidByGiftcard =
		'gift_cards' in (cart || {}) && 
		Array.isArray((cart as any)?.gift_cards) && 
		(cart as any).gift_cards.length > 0 && 
		cart?.total === 0;

	const previousStepsCompleted =
		cart.shipping_address &&
		cart.shipping_methods &&
		cart.shipping_methods.length > 0 &&
		(cart.payment_collection || paidByGiftcard);

	// Group items by seller
	const groupedItems: any = {};
	cart.items?.forEach((item: any) => {
		const seller = item.product?.seller;
		const sellerName = seller?.name || 'Maretinda';
		if (!groupedItems[sellerName]) {
			groupedItems[sellerName] = [];
		}
		groupedItems[sellerName].push({ ...item, sellerName: sellerName });
	});

	// Flatten all items
	const allItems = Object.values(groupedItems).flat() as any[];

	// Calculate total items count
	const totalItems = allItems.reduce((sum, item) => sum + item.quantity, 0);

	return (
		<div>
			{/* Header */}
			<div className="flex items-baseline justify-between mb-4">
				<h2 className="text-[17px] font-bold text-[#111827]">Order Summary</h2>
				<span className="text-[13px] text-[#6b7280]">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
			</div>

			{/* Product Items List */}
			<div className="mb-5 space-y-3">
				{allItems.map((item) => {
					const unitPrice = convertToLocale({
						amount: item.unit_price || 0,
						currency_code: cart.currency_code,
					});

					return (
						<div key={item.id} className="flex items-center gap-3 pb-3 border-b last:border-0 last:pb-0" style={{ borderColor: '#f3f4f6' }}>
							{/* Product Image */}
							<div className="w-16 h-16 flex items-center justify-center bg-gray-50 rounded-lg flex-shrink-0 overflow-hidden">
								{item.thumbnail ? (
									<Image
										alt={item.title || 'Product'}
										className="rounded-lg object-cover w-full h-full"
										height={64}
										src={decodeURIComponent(item.thumbnail)}
										width={64}
									/>
								) : (
									<Image
										alt="Product placeholder"
										className="rounded opacity-30"
										height={32}
										src={'/images/placeholder.svg'}
										width={32}
									/>
								)}
							</div>

							{/* Product Info */}
							<div className="flex-1 min-w-0">
								<h3 className="text-[14px] font-semibold leading-snug line-clamp-2 text-[#111827]">
									{item.title || item.subtitle}
								</h3>
								<p className="text-[12px] text-[#9ca3af] mt-0.5">{item.sellerName}</p>
								<div className="flex items-center justify-between mt-1.5">
									<span className="text-[14px] font-bold text-[#432C63]">
										{unitPrice}
									</span>
									<UpdateCartItemButton
										lineItemId={item.id}
										quantity={item.quantity}
									/>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Order Totals */}
			<div className="mb-6">
				<CartSummary
					currency_code={cart?.currency_code || ''}
					item_total={cart?.item_total || 0}
					shipping_total={cart?.shipping_total || 0}
					tax={cart?.tax_total || 0}
					total={cart?.total || 0}
					totalItems={totalItems}
					discount={cart?.discount_total || 0}
				/>
			</div>

			{previousStepsCompleted && (
				<PaymentButton cart={cart} data-testid="submit-order-button" />
			)}
		</div>
	);
};

export default Review;
