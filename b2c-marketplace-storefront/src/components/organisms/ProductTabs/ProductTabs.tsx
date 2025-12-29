'use client';

import type { HttpTypes } from '@medusajs/types';
import { Tabs } from '@medusajs/ui';
import { useState } from 'react';

import type { AdditionalAttributeProps } from '@/types/product';
import type { SellerProps } from '@/types/seller';

import ProductTabDetails from '../ProductTabContent/ProductTabDetails';
import ProductTabRating from '../ProductTabContent/ProductTabRating';
import ProductTabShipping from '../ProductTabContent/ProductTabShipping';

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
	const [value, setValue] = useState('details');
	return (
		<div className="w-full flex flex-col mt-20">
			<Tabs
				className="product-details-tab"
				onValueChange={setValue}
				value={value}
			>
				<Tabs.List className="justify-around">
					<Tabs.Trigger className="" value="details">
						Product Details
					</Tabs.Trigger>
					<Tabs.Trigger className="" value="rating">
						Rating & Reviews
					</Tabs.Trigger>
					<Tabs.Trigger className="" value="shipping">
						Shipping & Returns
					</Tabs.Trigger>
				</Tabs.List>
				<div className="mt-10">
					<Tabs.Content value="details">
						<ProductTabDetails product={product} />
					</Tabs.Content>
					<Tabs.Content value="rating">
						<ProductTabRating product={product} />
					</Tabs.Content>
					<Tabs.Content value="shipping">
						<ProductTabShipping product={product} />
					</Tabs.Content>
				</div>
			</Tabs>
		</div>
	);
};
