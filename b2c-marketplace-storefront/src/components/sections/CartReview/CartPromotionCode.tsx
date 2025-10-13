'use client';

import type { HttpTypes } from '@medusajs/types';
import { Heading, Label } from '@medusajs/ui';
import { useState } from 'react';

import { Button, Input } from '@/components/atoms';
import { applyPromotions } from '@/lib/data/cart';
import { toast } from '@/lib/helpers/toast';

export default function CartPromotionCode({
	cart,
}: {
	cart:
		| (HttpTypes.StoreCart & { promotions?: HttpTypes.StorePromotion[] })
		| null;
}) {
	const [promotionCode, setPromotionCode] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const handleApplyPromotionCode = async () => {
		setIsLoading(true);
		try {
			const res = await applyPromotions([promotionCode]);
			if (res) {
				toast.success({ title: 'Promotion code applied' });
			} else {
				toast.error({ title: 'Promotion code not found' });
			}
			setPromotionCode('');
		} catch (err) {
			console.log(err);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div>
			<Heading
				className="flex flex-row text-3xl-regular gap-x-2 items-baseline items-center"
				level="h2"
			>
				Promotion codes
			</Heading>
			<div>
				{cart?.promotions?.map((promo) => (
					<div
						className="mb-4 flex flex-row gap-x-2 items-center"
						key={promo.id}
					>
						<Label className="text-md">{promo.code}</Label>
					</div>
				))}
			</div>
			<Input
				onChange={(e) => setPromotionCode(e.target.value)}
				placeholder="Enter your promotion code"
				value={promotionCode}
			/>
			<div className="flex justify-end">
				<Button
					className="mt-4 px-6"
					disabled={isLoading || !promotionCode}
					loading={isLoading}
					onClick={handleApplyPromotionCode}
					variant="tonal"
				>
					Use promotion code
				</Button>
			</div>
		</div>
	);
}
