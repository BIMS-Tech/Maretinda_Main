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
	return (
		<div className="space-y-4 text-black text-lg">
			{/* Items Count */}
			<div className="flex justify-between checkout-summary-text">
				<span style={{ fontWeight: 600 }}>Items:</span>
				<span style={{ fontWeight: 700 }}>{totalItems || 0}</span>
			</div>

			{/* Subtotal */}
			<div className="flex justify-between checkout-summary-text">
				<span style={{ fontWeight: 600 }}>Subtotal:</span>
				<span style={{ fontWeight: 700 }}>
					{convertToLocale({
						amount: item_total,
						currency_code,
					})}
				</span>
			</div>

			{/* Shipping */}
			<div className="flex justify-between checkout-summary-text">
				<span style={{ fontWeight: 600 }}>Shipping:</span>
				<span style={{ fontWeight: 700 }}>
					{convertToLocale({
						amount: shipping_total,
						currency_code,
					})}
				</span>
			</div>

			{/* Taxes */}
			<div className="flex justify-between checkout-summary-text">
				<span style={{ fontWeight: 600 }}>Taxes:</span>
				<span style={{ fontWeight: 700 }}>
					{convertToLocale({
						amount: tax,
						currency_code,
					})}
				</span>
			</div>

			{/* Coupon Discount */}
			<div className="flex justify-between checkout-summary-text">
				<span style={{ fontWeight: 600 }}>Coupon Discount:</span>
				<span style={{ fontWeight: 700 }}>
					{convertToLocale({
						amount: discount || 0,
						currency_code,
					})}
				</span>
			</div>

			{/* Total */}
			<div className="flex justify-between border-t pt-4 mt-4" style={{ borderColor: '#e5e7eb' }}>
				<span className="text-lg" style={{ color: '#111827', fontWeight: 900 }}>Total:</span>
				<span className="text-lg" style={{ color: '#111827', fontWeight: 900 }}>
					{convertToLocale({
						amount: total,
						currency_code,
					})}
				</span>
			</div>
		</div>
	);
};
