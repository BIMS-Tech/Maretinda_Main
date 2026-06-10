'use client';

import type { HttpTypes } from '@medusajs/types';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { AdditionalAttributeProps } from '@/types/product';
import type { SellerProps } from '@/types/seller';

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
	seller,
}: {
	product: HttpTypes.StoreProduct & {
		attribute_values?: AdditionalAttributeProps[];
		reviews?: any[];
	};
	seller: SellerProps;
}) => {
	const [value, setValue] = useState<TabId>('details');

	return (
		<div className="w-full mt-12">
			{/* Tab bar */}
			<div className="border-b border-black/[0.09]">
				<div className="flex gap-0 overflow-x-auto">
					{TABS.map((tab) => (
						<button
							key={tab.id}
							type="button"
							onClick={() => setValue(tab.id)}
							className={cn(
								'shrink-0 px-5 py-3.5 text-[14px] font-semibold transition-all duration-200 border-b-2 -mb-px whitespace-nowrap',
								value === tab.id
									? 'border-[#432C63] text-[#432C63]'
									: 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300',
							)}
						>
							{tab.label}
						</button>
					))}
				</div>
			</div>

			{/* Tab content */}
			<div className="mt-8">
				{value === 'details' && (
					<ProductTabDetails product={product} />
				)}
				{value === 'rating' && (
					<ProductTabRating product={product} />
				)}
				{value === 'shipping' && (
					<ProductTabShipping product={product} />
				)}
			</div>
		</div>
	);
};
