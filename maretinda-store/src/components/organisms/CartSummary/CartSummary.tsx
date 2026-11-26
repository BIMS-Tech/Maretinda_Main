'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';

import { AnimatedNumber, EASE_OUT } from '@/components/motion';
import { convertToLocale } from '@/lib/helpers/money';

export const CartSummary = ({
	item_subtotal,
	shipping_total,
	total,
	currency_code,
	tax,
	totalItems,
	discount,
	has_shipping_method = true,
}: {
	/** Items before discount: the discount has its own line below */
	item_subtotal: number;
	shipping_total: number;
	total: number;
	currency_code: string;
	tax: number;
	totalItems?: number;
	discount?: number;
	/** False until the buyer picks a delivery option; "Free" before then was untrue */
	has_shipping_method?: boolean;
}) => {
	const money = (amount: number) => convertToLocale({ amount, currency_code });
	const hasDiscount = (discount || 0) > 0;

	return (
		<div className="text-[14px]">
			<div className="space-y-2.5">
				{/* Items Count */}
				<div className="flex justify-between">
					<span className="text-[#6b7280]">Items</span>
					<AnimatedNumber className="font-medium text-[#111827]" duration={0.4} value={totalItems || 0} />
				</div>

				{/* Subtotal */}
				<div className="flex justify-between">
					<span className="text-[#6b7280]">Subtotal</span>
					<AnimatedNumber className="font-medium text-[#111827]" format={money} value={item_subtotal} />
				</div>

				{/* Shipping */}
				<div className="flex justify-between">
					<span className="text-[#6b7280]">Shipping</span>
					{!has_shipping_method ? (
						<span className="text-[#6b7280]">Calculated at checkout</span>
					) : shipping_total > 0 ? (
						<AnimatedNumber className="font-medium text-[#111827]" format={money} value={shipping_total} />
					) : (
						<span className="font-semibold text-emerald-600">Free</span>
					)}
				</div>

				{/* Taxes */}
				<div className="flex justify-between">
					<span className="text-[#6b7280]">Taxes</span>
					<AnimatedNumber className="font-medium text-[#111827]" format={money} value={tax} />
				</div>

				{/* Coupon Discount — only when applied */}
				<AnimatePresence initial={false}>
					{hasDiscount && (
						<m.div animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden" exit={{ height: 0, opacity: 0 }} initial={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE_OUT }}>
							<div className="flex justify-between">
								<span className="text-[#6b7280]">Coupon discount</span>
								<span className="font-semibold text-emerald-600">−<AnimatedNumber format={money} value={discount || 0} /></span>
							</div>
						</m.div>
					)}
				</AnimatePresence>
			</div>

			{/* Total */}
			<div
				className="mt-4 flex items-center justify-between rounded-xl px-4 py-3.5"
				style={{ backgroundColor: 'rgba(67,44,99,0.06)' }}
			>
				<span className="text-[15px] font-bold text-[#111827]">Total</span>
				<AnimatedNumber className="text-[22px] font-extrabold leading-none text-[#432C63]" format={money} value={total} />
			</div>
		</div>
	);
};
