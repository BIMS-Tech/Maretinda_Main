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
		<div className="space-y-3 text-sm">
			{/* Items Count */}
			<div className="flex justify-between" style={{ color: '#374151' }}>
				<span style={{ fontWeight: 400 }}>Items:</span>
				<span style={{ fontWeight: 500 }}>{totalItems || 0}</span>
			</div>

			{/* Subtotal */}
			<div className="flex justify-between" style={{ color: '#374151' }}>
				<span style={{ fontWeight: 400 }}>Subtotal:</span>
				<span style={{ fontWeight: 500 }}>
					{convertToLocale({
						amount: item_total,
						currency_code,
					})}
				</span>
			</div>

			{/* Shipping */}
			<div className="flex justify-between" style={{ color: '#374151' }}>
				<span style={{ fontWeight: 400 }}>Shipping:</span>
				<span style={{ fontWeight: 500 }}>
					{convertToLocale({
						amount: shipping_total,
						currency_code,
					})}
				</span>
			</div>

			{/* Taxes */}
			<div className="flex justify-between" style={{ color: '#374151' }}>
				<span style={{ fontWeight: 400 }}>Taxes:</span>
				<span style={{ fontWeight: 500 }}>
					{convertToLocale({
						amount: tax,
						currency_code,
					})}
				</span>
			</div>

			{/* Coupon Discount */}
			<div className="flex justify-between" style={{ color: '#374151' }}>
				<span style={{ fontWeight: 400 }}>Coupon Discount:</span>
				<span style={{ fontWeight: 500 }}>
					{convertToLocale({
						amount: discount || 0,
						currency_code,
					})}
				</span>
			</div>

			{/* Total */}
			<div className="flex justify-between border-t pt-4 mt-4" style={{ borderColor: '#e5e7eb' }}>
				<span className="text-lg" style={{ color: '#111827', fontWeight: 700 }}>Total:</span>
				<span className="text-lg" style={{ color: '#111827', fontWeight: 700 }}>
					{convertToLocale({
						amount: total,
						currency_code,
					})}
				</span>
			</div>
		</div>
	);
};
