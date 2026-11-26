'use client';

import type { HttpTypes } from '@medusajs/types';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import Image from 'next/image';

import { AnimatedNumber, SPRING_SOFT } from '@/components/motion';
import { CartSummary } from '@/components/organisms/CartSummary/CartSummary';
import { UpdateCartItemButton } from '@/components/molecules/UpdateCartItemButton/UpdateCartItemButton';
import { cardImage, groundOf } from '@/lib/helpers/card-image';
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
			<ul className="relative mb-6 space-y-4">
				<AnimatePresence initial={false} mode="popLayout">
					{allItems.map((item) => (
						<m.li
							animate={{ opacity: 1, x: 0 }}
							className="flex items-center gap-4"
							exit={{ opacity: 0, x: 30 }}
							initial={{ opacity: 0, x: 30 }}
							key={item.id}
							layout
							transition={SPRING_SOFT}
						>
							<span className="relative h-[68px] w-[68px] shrink-0">
								<span className="relative block h-full w-full overflow-hidden rounded-[16px]" style={{ backgroundColor: groundOf(item.product_id ?? item.id) }}>
									<Image
										alt={item.title || 'Product'}
										className="object-contain p-2 mix-blend-multiply"
										fill
										sizes="68px"
										src={cardImage(item.thumbnail) || '/images/placeholder.svg'}
									/>
								</span>
								<span className="badge-bump absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1E1430] px-1 text-[10.5px] font-bold tabular-nums text-white" key={item.quantity}>
									{item.quantity}
								</span>
							</span>
							<div className="min-w-0 flex-1">
								<h3 className="line-clamp-2 text-[14px] font-semibold leading-snug text-[#111827]">{item.product_title || item.title || item.subtitle}</h3>
								<p className="mt-0.5 truncate text-[12px] text-[#9ca3af]">
									{item.variant_title && !/default/i.test(item.variant_title) ? `${item.variant_title} · ` : ''}
									{item.sellerName}
								</p>
								<div className="mt-2 flex items-center justify-between gap-2">
									<UpdateCartItemButton lineItemId={item.id} quantity={item.quantity} />
									<AnimatedNumber
										className="text-[14px] font-bold text-[#432C63]"
										format={(n) => convertToLocale({ amount: n, currency_code: cart.currency_code })}
										value={(item.unit_price || 0) * item.quantity}
									/>
								</div>
							</div>
						</m.li>
					))}
				</AnimatePresence>
			</ul>

			{/* Order Totals */}
			<div className="mb-6">
				<CartSummary
					currency_code={cart?.currency_code || ''}
					item_subtotal={cart?.item_subtotal || 0}
					shipping_total={cart?.shipping_total || 0}
					has_shipping_method={(cart?.shipping_methods?.length ?? 0) > 0}
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
