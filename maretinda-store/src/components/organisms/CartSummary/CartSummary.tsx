'use client';

import { convertToLocale } from '@/lib/helpers/money';

export const CartSummary = ({
	item_total,
	shipping_total,
	total,
	currency_code,
	tax,
	totalItems,
	discount,
}: {
	item_total: number;
	shipping_total: number;
	total: number;
	currency_code: string;
	tax: number;
	totalItems?: number;
	discount?: number;
}) => {
	const money = (amount: number) => convertToLocale({ amount, currency_code });
	const hasDiscount = (discount || 0) > 0;

	return (
		<div className="text-[14px]">
			<div className="space-y-2.5">
				{/* Items Count */}
				<div className="flex justify-between">
					<span className="text-[#6b7280]">Items</span>
					<span className="font-medium text-[#111827]">{totalItems || 0}</span>
				</div>

				{/* Subtotal */}
				<div className="flex justify-between">
					<span className="text-[#6b7280]">Subtotal</span>
					<span className="font-medium text-[#111827]">{money(item_total)}</span>
				</div>

				{/* Shipping */}
				<div className="flex justify-between">
					<span className="text-[#6b7280]">Shipping</span>
					{shipping_total > 0 ? (
						<span className="font-medium text-[#111827]">{money(shipping_total)}</span>
					) : (
						<span className="font-semibold text-emerald-600">Free</span>
					)}
				</div>

				{/* Taxes */}
				<div className="flex justify-between">
					<span className="text-[#6b7280]">Taxes</span>
					<span className="font-medium text-[#111827]">{money(tax)}</span>
				</div>

				{/* Coupon Discount — only when applied */}
				{hasDiscount && (
					<div className="flex justify-between">
						<span className="text-[#6b7280]">Coupon discount</span>
						<span className="font-semibold text-emerald-600">−{money(discount || 0)}</span>
					</div>
				)}
			</div>

			{/* Total */}
			<div
				className="mt-4 flex items-center justify-between rounded-xl px-4 py-3.5"
				style={{ backgroundColor: 'rgba(67,44,99,0.06)' }}
			>
				<span className="text-[15px] font-bold text-[#111827]">Total</span>
				<span className="text-[22px] font-extrabold leading-none" style={{ color: '#432C63' }}>
					{money(total)}
				</span>
			</div>
		</div>
	);
};
