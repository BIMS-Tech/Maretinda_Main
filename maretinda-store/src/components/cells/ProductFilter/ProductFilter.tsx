'use client';

import { Accordion, FilterCheckboxOption } from '@/components/molecules';
import useFilters from '@/hooks/useFilters';

const filters = [
	{ amount: 140, label: 'Sneakers' },
	{ amount: 100, label: 'Boots' },
	{ amount: 100, label: 'Flat Shoes' },
	{ amount: 31, label: 'High Heels' },
	{ amount: 1, label: 'Sandals' },
];

export const ProductFilter = () => {
	const { updateFilters, isFilterActive } = useFilters('product');

	const selectHandler = (option: string) => {
		updateFilters(option);
	};

	return (
		<Accordion heading="Product">
			<ul className="px-4">
				{filters.map(({ label, amount }) => (
					<li className="mb-4" key={label}>
						<FilterCheckboxOption
							amount={amount}
							checked={isFilterActive(label)}
							disabled={Boolean(!amount)}
							label={label}
							onCheck={selectHandler}
						/>
					</li>
				))}
			</ul>
		</Accordion>
	);
};
