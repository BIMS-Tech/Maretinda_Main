'use client';

import type { HttpTypes } from '@medusajs/types';
import { useState } from 'react';

import type { AdditionalAttributeProps } from '@/types/product';
import type { SellerProps } from '@/types/seller';

import ProductTabDetails from '../ProductTabContent/ProductTabDetails';
import ProductTabRating from '../ProductTabContent/ProductTabRating';
import ProductTabShipping from '../ProductTabContent/ProductTabShipping';

const TABS = [
	{ key: 'details', label: 'Product Details' },
	{ key: 'rating', label: 'Ratings & Reviews' },
	{ key: 'shipping', label: 'Shipping & Returns' },
] as const;

type TabKey = typeof TABS[number]['key'];

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
	const [active, setActive] = useState<TabKey>('details');

	return (
		<div className="w-full mt-14">
			{/* Tab bar */}
			<div className="flex border-b border-black/[0.08]">
				{TABS.map(tab => (
					<button
						key={tab.key}
						type="button"
						onClick={() => setActive(tab.key)}
						className="relative px-5 py-3 text-[13px] font-semibold transition-colors duration-150"
						style={{
							color: active === tab.key ? '#432C63' : '#9ca3af',
						}}
					>
						{tab.label}
						{active === tab.key && (
							<span
								className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full"
								style={{ backgroundColor: '#432C63' }}
							/>
						)}
					</button>
				))}
			</div>

			{/* Tab content */}
			<div className="py-8">
				{active === 'details' && <ProductTabDetails product={product} />}
				{active === 'rating' && <ProductTabRating product={product} />}
				{active === 'shipping' && <ProductTabShipping product={product} />}
			</div>
		</div>
	);
};
