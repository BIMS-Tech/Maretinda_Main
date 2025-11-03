'use client';

import { Chip } from '@/components/atoms';
import useFilters from '@/hooks/useFilters';
import { CloseIcon } from '@/icons';

const filtersLabels = {
	brand: 'Brand',
	category: 'Category',
	color: 'Color',
	condition: 'Condition',
	max_price: 'Max Price',
	min_price: 'Min Price',
	query: 'Search',
	rating: 'Rating',
	size: 'Size',
};

const Element = ({
	element,
	filter,
}: {
	element: string;
	filter: string[];
}) => {
	const { updateFilters } = useFilters(filter[0]);

	const removeFilterHandler = (filter: string) => {
		updateFilters(filter);
	};

	return (
		<span className="flex items-center cursor-default whitespace-nowrap text-white">
			<div className="border-r-[1px] border-[#e4e4e7] px-2 py-1">
				<span className="capitalize">{filter[0].replace("_", " ")}:</span>{" "}
				{element}
			</div>
			<button
				className="cursor-pointer px-2 py-1"
				type="button"
				onClick={() => removeFilterHandler(element)}
			>
				<CloseIcon pathClassName="!fill-white" size={15} />
			</button>
		</span>
	);
};

export const ActiveFilterElement = ({ filter }: { filter: string[] }) => {
	const activeFilters = filter[1].split(",");

	return (
		<div className="flex flex-wrap gap-[23px] items-center mb-4">
			{activeFilters.map((element) => {
				return (
					<Chip
						className="!bg-[rgba(var(--brand-purple-500))] !py-0 !px-0 !rounded-[6px] border-[#e4e4e7] border-[1px]"
						key={element}
						value={<Element element={element} filter={filter} />}
					/>
				);
			})}
		</div>
	);
};
