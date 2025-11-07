'use client';

import { ActiveFilterElement } from '@/components/cells';
import useFilters from "@/hooks/useFilters";
import useGetAllSearchParams from '@/hooks/useGetAllSearchParams';

export const ProductListingActiveFilters = () => {
	const { allSearchParams } = useGetAllSearchParams();
	const filters = Object.entries(allSearchParams).filter(
		(element) =>
			element[0] !== 'sortBy' &&
			element[0] !== 'page' &&
			element[0] !== 'sold' &&
			element[0] !== 'products[page]',
	);
	const { clearAllFilters } = useFilters(filters[0]?.[0] || "");

	return (
		<div className="mr-[27px]">
			<div className="flex justify-between mb-6">
				<div className="label-xl text-black !leading-[21px]">Refine by</div>
				<button
					type="button"
					className="text-base text-black underline leading-none"
					onClick={clearAllFilters}
				>
					Clear All
				</button>
			</div>
			{filters.map((filter) => (
				<ActiveFilterElement filter={filter} key={filter[0]} />
			))}
		</div>
	);
};
