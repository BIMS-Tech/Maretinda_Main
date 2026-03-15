'use client';

import { Accordion, FilterCheckboxOption } from '@/components/molecules';
import useFilters from '@/hooks/useFilters';

const filters = [
	{ amount: 78, label: 'New' },
	{ amount: 40, label: 'New - With tags' },
	{ amount: 7, label: 'Used - Excellent' },
	{ amount: 16, label: 'Used - Good' },
	{ amount: 0, label: 'Used - Fair' },
];

export const ConditionFilter = () => {
	const { updateFilters, isFilterActive } = useFilters('condition');

	const selectHandler = (option: string) => {
		updateFilters(option);
	};

	return (
		<Accordion heading="Condition">
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
