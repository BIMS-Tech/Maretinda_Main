'use client';

import type { HttpTypes } from '@medusajs/types';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { useState } from 'react';

import { EASE_OUT, SPRING } from '@/components/motion';
import { cn } from '@/lib/utils';
import type { AdditionalAttributeProps } from '@/types/product';

import ProductTabDetails from '../ProductTabContent/ProductTabDetails';
import ProductTabRating from '../ProductTabContent/ProductTabRating';
import ProductTabShipping from '../ProductTabContent/ProductTabShipping';

const TABS = [
	{ id: 'details', label: 'Product Details' },
	{ id: 'rating', label: 'Ratings & Reviews' },
	{ id: 'shipping', label: 'Shipping & Returns' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export const ProductTabs = ({
	product,
	descriptionHtml,
}: {
	descriptionHtml: string;
	product: HttpTypes.StoreProduct & {
		attribute_values?: AdditionalAttributeProps[];
		reviews?: any[];
	};
}) => {
	const [value, setValue] = useState<TabId>('details');

	return (
		<div className="w-full mt-12">
			{/* Tab bar */}
			<div className="border-b border-black/[0.09]">
				<div className="no-scrollbar flex gap-0 overflow-x-auto">
					{TABS.map((tab) => (
						<button
							aria-expanded={value === tab.id}
							className={cn(
								'relative shrink-0 whitespace-nowrap px-5 py-3.5 text-[14px] font-semibold transition-colors duration-200',
								value === tab.id ? 'text-[#432C63]' : 'text-gray-500 hover:text-gray-800',
							)}
							key={tab.id}
							onClick={() => setValue(tab.id)}
							type="button"
						>
							{tab.label}
							{value === tab.id && <m.span className="absolute inset-x-3 -bottom-px h-[2.5px] rounded-full bg-[#432C63]" layoutId="product-tab" transition={SPRING} />}
						</button>
					))}
				</div>
			</div>

			{/* Tab content */}
			<div className="mt-8">
				<AnimatePresence initial={false} mode="wait">
					<m.div animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} initial={{ opacity: 0, y: 10 }} key={value} transition={{ duration: 0.28, ease: EASE_OUT }}>
						{value === 'details' && <ProductTabDetails descriptionHtml={descriptionHtml} product={product} />}
						{value === 'rating' && <ProductTabRating product={product} />}
						{value === 'shipping' && <ProductTabShipping product={product} />}
					</m.div>
				</AnimatePresence>
			</div>
		</div>
	);
};
