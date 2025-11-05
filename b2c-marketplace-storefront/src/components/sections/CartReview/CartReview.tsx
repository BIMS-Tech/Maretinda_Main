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
		groupedItems[sellerName].push({ ...item, vendorName: sellerName });
	});

	// Flatten all items
	const allItems = Object.values(groupedItems).flat() as any[];

	// Calculate total items count
	const totalItems = allItems.reduce((sum, item) => sum + item.quantity, 0);

	return (
		<div>
			{/* Product Items List */}
			<div className="mb-6 space-y-4">
				{allItems.map((item) => {
					const unitPrice = convertToLocale({
						amount: item.unit_price || 0,
						currency_code: cart.currency_code,
					});

					return (
						<div key={item.id} className="flex items-center gap-4 pb-4 border-b last:border-0" style={{ borderColor: '#f3f4f6' }}>
							{/* Product Image */}
							<div className="w-20 h-20 flex items-center justify-center bg-gray-50 rounded flex-shrink-0">
								{item.thumbnail ? (
									<Image
										alt={item.title || 'Product'}
										className="rounded object-contain"
										height={80}
										src={decodeURIComponent(item.thumbnail)}
										width={80}
									/>
								) : (
									<Image
										alt="Product placeholder"
										className="rounded opacity-30"
										height={40}
										src={'/images/placeholder.svg'}
										width={40}
									/>
								)}
							</div>

							{/* Product Info */}
							<div className="flex-1 min-w-0">
								<h3 className="font-medium mb-1 truncate" style={{ color: '#111827', fontWeight: 500 }}>
									{item.title || item.subtitle}
								</h3>
								<p className="text-xs mb-2" style={{ color: '#6b7280' }}>
									{item.vendorName}
								</p>
								<div className="flex items-center justify-between">
									<span className="font-medium" style={{ color: '#111827', fontWeight: 500 }}>
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
