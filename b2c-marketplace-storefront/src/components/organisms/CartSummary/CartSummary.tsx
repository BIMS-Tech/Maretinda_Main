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
			<div className="flex justify-between">
				<span>Items:</span>
				<span className="font-bold">{totalItems || 0}</span>
			</div>

			{/* Subtotal */}
			<div className="flex justify-between">
				<span>Subtotal:</span>
				<span className="font-bold">
					{convertToLocale({
						amount: item_total,
						currency_code,
					})}
				</span>
			</div>

			{/* Shipping */}
			<div className="flex justify-between">
				<span>Shipping:</span>
				<span className="font-bold">
					{convertToLocale({
						amount: shipping_total,
						currency_code,
					})}
				</span>
			</div>

			{/* Taxes */}
			<div className="flex justify-between">
				<span>Taxes:</span>
				<span className="font-bold">
					{convertToLocale({
						amount: tax,
						currency_code,
					})}
				</span>
			</div>

			{/* Coupon Discount */}
			<div className="flex justify-between">
				<span>Coupon Discount:</span>
				<span className="font-bold">
					{convertToLocale({
						amount: discount || 0,
						currency_code,
					})}
				</span>
			</div>

			{/* Total */}
			<div className="flex justify-between border-t pt-4 mt-4 border-black/10">
				<span className="font-bold">Total:</span>
				<span className="font-bold">
					{convertToLocale({
						amount: total,
						currency_code,
					})}
				</span>
			</div>
		</div>
	);
};
