'use client';

import { Chip } from '@/components/atoms';
import { Accordion } from '@/components/molecules';
import useFilters from '@/hooks/useFilters';

const sizeOptions = [
	'XS',
	'S',
	'M',
	'L',
	'XL',
	'XXL',
	'2XL',
	'3XL',
	'One Size',
];

export const SizeFilter = () => {
	const { updateFilters, isFilterActive } = useFilters('size');

	const selectSizeHandler = (size: string) => {
		updateFilters(size);
	};

	return (
		<Accordion heading="Size">
			<ul className="grid grid-cols-3 mt-2 gap-2">
				{sizeOptions.map((option) => (
					<li key={option}>
						<Chip
							className="w-full !justify-center !py-2 !font-normal"
							onSelect={() => selectSizeHandler(option)}
							selected={isFilterActive(option)}
							value={option}
						/>
					</li>
				))}
			</ul>
		</Accordion>
	);
};
