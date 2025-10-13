'use client';

import type { HttpTypes } from '@medusajs/types';
import { BaseHit, type Hit } from 'instantsearch.js';

import { Chip } from '@/components/atoms';
import useUpdateSearchParams from '@/hooks/useUpdateSearchParams';

export const ProductVariants = ({
	product,
	selectedVariant,
}: {
	product: HttpTypes.StoreProduct;
	selectedVariant: Record<string, string>;
}) => {
	const updateSearchParams = useUpdateSearchParams();

	// update the options when a variant is selected
	const setOptionValue = (optionId: string, value: string) => {
		if (value) updateSearchParams(optionId, value);
	};

	return (
		<div className="my-4 space-y-2">
			{(product.options || []).map(
				({ id, title, values }: HttpTypes.StoreProductOption) => (
					<div key={id}>
						<span className="label-md text-secondary">
							{title}:{' '}
						</span>
						<span className="label-md text-primary">
							{selectedVariant[title.toLowerCase()]}
						</span>
						<div className="flex gap-2 mt-2">
							{(values || []).map(
								({
									id,
									value,
								}: Partial<
									Hit<HttpTypes.StoreProductOptionValue>
								>) => (
									<Chip
										color={title === 'Color'}
										key={id}
										onSelect={() =>
											setOptionValue(
												title.toLowerCase(),
												value || '',
											)
										}
										selected={
											selectedVariant[
												title.toLowerCase()
											] === value
										}
										value={value}
									/>
								),
							)}
						</div>
					</div>
				),
			)}
		</div>
	);
};
