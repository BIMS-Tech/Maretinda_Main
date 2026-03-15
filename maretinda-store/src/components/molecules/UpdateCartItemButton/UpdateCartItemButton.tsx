'use client';

import { useState } from 'react';
import { LuMinus, LuPlus } from 'react-icons/lu';

import { Button } from '@/components/atoms';
import { updateLineItem } from '@/lib/data/cart';

export const UpdateCartItemButton = ({
	quantity,
	lineItemId,
	isProductPage = false,
}: {
	quantity: number;
	lineItemId: string;
	isProductPage?: boolean;
}) => {
	const [isChanging, setIsChanging] = useState(false);

	const handleChange = async ({
		lineId,
		quantity,
	}: {
		lineId: string;
		quantity: number;
	}) => {
		setIsChanging(true);
		await updateLineItem({ lineId, quantity }).finally(() => {
			setIsChanging(false);
		});
	};
	const isProduct = isProductPage && '!bg-transparent px-0';

	// Cart page style - horizontal bar with quantity in center
	if (!isProductPage) {
		return (
			<div className="flex items-center border border-gray-300 rounded-md h-9 bg-white">
				<Button
					className="w-8 h-8 flex items-center justify-center !bg-transparent hover:bg-gray-100 rounded-l-md rounded-r-none !p-0 disabled:border-none"
					disabled={quantity === 1 || isChanging}
					onClick={() =>
						!isChanging &&
						handleChange({
							lineId: lineItemId,
							quantity: quantity - 1,
						})
					}
					variant="tonal"
				>
					<LuMinus
						className="!text-black"
						size={14}
						style={{ color: '#000' }}
					/>
				</Button>
				<span
					className="flex-1 text-center text-sm min-w-[2rem]"
					style={{ color: '#111827', fontWeight: 500 }}
				>
					{quantity}
				</span>
				<Button
					className="w-8 h-8 flex items-center justify-center !bg-transparent hover:bg-gray-100 rounded-r-md rounded-l-none !p-0 !border-none"
					disabled={isChanging}
					onClick={() =>
						!isChanging &&
						handleChange({
							lineId: lineItemId,
							quantity: quantity + 1,
						})
					}
					variant="tonal"
				>
					<LuPlus
						className="!text-black"
						size={14}
						style={{ color: '#000' }}
					/>
				</Button>
			</div>
		);
	}

	// Product page style - original design
	return (
		<div
			className={`flex items-center gap-4 mt-2 ${isProductPage && 'border border-black rounded-sm h-[46px] !mt-0 px-3'}`}
		>
			<Button
				className={`w-8 h-8 flex items-center justify-center ${isProduct}`}
				disabled={quantity === 1}
				onClick={() =>
					!isChanging &&
					handleChange({ lineId: lineItemId, quantity: quantity - 1 })
				}
				variant="tonal"
			>
				<LuMinus className="text-black" size={16} />
			</Button>
			<span className="text-primary font-medium">{quantity}</span>
			<Button
				className={`w-8 h-8 flex items-center justify-center ${isProduct}`}
				onClick={() =>
					!isChanging &&
					handleChange({ lineId: lineItemId, quantity: quantity + 1 })
				}
				variant="tonal"
			>
				<LuPlus className="text-black" size={16} />
			</Button>
		</div>
	);
};
