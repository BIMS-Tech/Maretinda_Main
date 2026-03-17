'use client';

import { useState } from 'react';

import { Button } from '@/components/atoms';
import {
	BrandFilter,
	ColorFilter,
	PriceFilter,
	SizeFilter,
} from '@/components/cells';
import type { BrandOption } from '@/components/cells/BrandFilter/BrandFilter';
import useFilters from '@/hooks/useFilters';
import { CloseIcon } from '@/icons';
import { cn } from '@/lib/utils';

import { ProductListingActiveFilters } from '../ProductListingActiveFilters/ProductListingActiveFilters';

export const ProductSidebar = ({ brands }: { brands: BrandOption[] }) => {
	const [filterModal, setFilterModal] = useState(false);
	const { clearAllFilters } = useFilters('');

	return (
		<aside className="w-full relative">
			<div
				className={cn(
					'md:relative w-full h-full bg-primary top-0 left-0 transition-opacity duration-100',
					filterModal
						? 'opacity-1 z-20'
						: 'opacity-0 -z-10 md:opacity-100 md:z-10',
				)}
			>
				{filterModal && (
					<div className="md:hidden">
						<div className="p-4 border-y flex items-center justify-between mb-4">
							<h3 className="uppercase heading-md">Filters</h3>
							<div
								className="cursor-pointer"
								onClick={() => setFilterModal(false)}
							>
								<CloseIcon size={20} />
							</div>
						</div>
						<div className="px-2 mb-4 md:mb-0">
							<ProductListingActiveFilters />
						</div>
					</div>
				)}

				<div className="px-2 md:px-0 overflow-y-scroll md:overflow-y-auto h-[calc(100vh-200px)] md:h-full no-scrollbar">
					<PriceFilter />
					<BrandFilter brands={brands} />
					<SizeFilter />
					<ColorFilter />
				</div>
				<div className="bg-primary md:hidden absolute bottom-0 left-0 w-full px-4 flex items-center py-4 border-y gap-2">
					<Button
						className="w-1/2 uppercase label-sm"
						onClick={() => clearAllFilters()}
						variant="tonal"
					>
						Clear all
					</Button>
					<Button
						className="w-1/2 uppercase label-sm"
						onClick={() => setFilterModal(false)}
					>
						View listings
					</Button>
				</div>
			</div>
		</aside>
	);
};
