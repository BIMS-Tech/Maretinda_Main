'use client';

import type { HttpTypes } from '@medusajs/types';
import { useState } from 'react';

import { Button, Input } from '@/components/atoms';
import { applyPromotions } from '@/lib/data/cart';
import { toast } from '@/lib/helpers/toast';

export default function CartPromotionCode({
	cart,
}: {
	cart: HttpTypes.StoreCart | null;
}) {
	const [promotionCode, setPromotionCode] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const handleApplyPromotionCode = async () => {
		if (!promotionCode.trim()) return;

		setIsLoading(true);
		try {
			const res = await applyPromotions([promotionCode]);
			if (res) {
				toast.success({ title: 'Promotion code applied' });
				setPromotionCode('');
			} else {
				toast.error({ title: 'Promotion code not found' });
			}
		} catch (err) {
			console.log(err);
			toast.error({ title: 'Failed to apply promotion code' });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-2">
			{/* Show applied promotions */}
			{cart?.promotions && cart.promotions.length > 0 && (
				<div className="mb-3">
					{cart.promotions.map((promo) => (
						<div
							className="text-sm text-green-600 mb-1"
							key={promo.id}
						>
							✓ {promo.code} applied
						</div>
					))}
				</div>
			)}

			{/* Coupon Input */}
			<div className="flex gap-1.5 items-end">
				<Input
					className="flex-1 h-10 px-3 rounded-l-[6px] rounded-r-none"
					onChange={(e) => setPromotionCode(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							handleApplyPromotionCode();
						}
					}}
					placeholder="Coupon Code"
					value={promotionCode}
				/>
				<Button
					className=" !text-black !font-medium whitespace-nowrap px-4 h-10 rounded-l-none rounded-r-[6px]"
					disabled={isLoading || !promotionCode.trim()}
					loading={isLoading}
					onClick={handleApplyPromotionCode}
					style={{ backgroundColor: '#facc15', color: '#000' }}
				>
					Apply Coupon
				</Button>
			</div>
		</div>
	);
}
