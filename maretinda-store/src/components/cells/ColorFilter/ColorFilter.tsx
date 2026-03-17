'use client';

import { Accordion, FilterCheckboxOption } from '@/components/molecules';
import useFilters from '@/hooks/useFilters';
import { cn } from '@/lib/utils';

const colorFilters = [
	{ color: 'bg-[rgba(9,9,9,1)]', label: 'Black' },
	{ color: 'bg-[rgba(82,82,82,1)]', label: 'Grey' },
	{ color: 'bg-[rgba(255,255,255,1)]', label: 'White' },
	{ color: 'bg-[rgba(255,191,58,1)]', label: 'Yellow' },
	{ color: 'bg-[rgba(217,45,32,1)]', label: 'Red' },
	{ color: 'bg-[rgba(247,144,9,1)]', label: 'Orange' },
	{ color: 'bg-[rgba(77,160,255,1)]', label: 'Blue' },
	{ color: 'bg-[rgba(0,67,143,1)]', label: 'Navy' },
	{ color: 'bg-[rgba(23,163,74,1)]', label: 'Green' },
	{ color: 'bg-[rgba(236,72,153,1)]', label: 'Pink' },
	{ color: 'bg-[rgba(139,92,246,1)]', label: 'Purple' },
	{ color: 'bg-[rgba(180,83,9,1)]', label: 'Brown' },
];

export const ColorFilter = () => {
	const { updateFilters, isFilterActive } = useFilters('color');

	const selectHandler = (option: string) => {
		updateFilters(option);
	};

	return (
		<Accordion heading="Color">
			<ul className="px-4">
				{colorFilters.map(({ label, color }) => (
					<li
						className="mb-4 flex items-center justify-between"
						key={label}
					>
						<FilterCheckboxOption
							checked={isFilterActive(label)}
							label={label}
							onCheck={selectHandler}
						/>
						<div
							className={cn(
								'w-5 h-5 border border-primary rounded-xs',
								color,
							)}
						/>
					</li>
				))}
			</ul>
		</Accordion>
	);
};
