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

export const ActiveFilterElement = ({ filter }: { filter: string[] }) => {
	const { updateFilters } = useFilters(filter[0]);

	const activeFilters = filter[1].split(',');

	const removeFilterHandler = (filter: string) => {
		updateFilters(filter);
	};

	return (
		<div className="flex gap-2 items-center mb-4">
			<span className="label-md hidden md:inline-block">
				{filtersLabels[filter[0] as keyof typeof filtersLabels]}:
			</span>
			{activeFilters.map((element) => {
				const Element = () => {
					return (
						<span className="flex gap-2 items-center cursor-default whitespace-nowrap">
							{element}{' '}
							<span onClick={() => removeFilterHandler(element)}>
								<CloseIcon
									className="cursor-pointer"
									size={16}
								/>
							</span>
						</span>
					);
				};
				return <Chip key={element} value={<Element />} />;
			})}
		</div>
	);
};
