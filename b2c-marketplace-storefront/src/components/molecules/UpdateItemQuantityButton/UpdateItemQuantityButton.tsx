'use client';

import { LuMinus, LuPlus } from 'react-icons/lu';

import { Button } from '@/components/atoms';

export const UpdateItemQuantityButton = ({
	isProductPage,
	quantity,
	setQuantity,
}: {
	isProductPage?: boolean;
	quantity: number;
	setQuantity: React.Dispatch<React.SetStateAction<number>>;
}) => {
	const isProduct = isProductPage && '!bg-transparent px-0';

	return (
		<div
			className={`flex items-center gap-4 mt-2 ${isProductPage && 'border border-black rounded-sm h-[46px] !mt-0 px-3'}`}
		>
			<Button
				className={`w-8 h-8 flex items-center justify-center disabled:border-none disabled:opacity-25 ${isProduct}`}
				disabled={quantity === 1}
				onClick={() => setQuantity((prevQuantity) => prevQuantity - 1)}
				variant="tonal"
			>
				<LuMinus className="text-black" size={16} />
			</Button>
			<span className="text-primary font-medium">{quantity}</span>
			<Button
				className={`w-8 h-8 flex items-center justify-center ${isProduct}`}
				onClick={() => setQuantity((prevQuantity) => prevQuantity + 1)}
				variant="tonal"
			>
				<LuPlus className="text-black" size={16} />
			</Button>
		</div>
	);
};
