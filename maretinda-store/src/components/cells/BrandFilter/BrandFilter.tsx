'use client';

import { useEffect, useState } from 'react';

import { Input } from '@/components/atoms';
import { Accordion, FilterCheckboxOption } from '@/components/molecules';
import useFilters from '@/hooks/useFilters';
import { SearchIcon } from '@/icons';

const brandFilters = [
	{ amount: 40, label: 'Abercrombie & Fitch' },
	{ amount: 78, label: 'Adidas' },
	{ amount: 7, label: 'Adore Me' },
	{ amount: 16, label: 'AllSaints' },
	{ amount: 7, label: 'American Eagle' },
];

export const BrandFilter = () => {
	const [brandsSearch, setBrandSearch] = useState('');
	const [filteredOptions, setFilteredOptions] = useState(brandFilters);
	const { updateFilters, isFilterActive } = useFilters('brand');

	useEffect(() => {
		if (!brandFilters) {
			setFilteredOptions(brandFilters);
		} else {
			setFilteredOptions(
				brandFilters.filter(({ label }) =>
					label.toLowerCase().includes(brandsSearch.toLowerCase()),
				),
			);
		}
	}, [brandsSearch]);

	const selectHandler = (option: string) => {
		updateFilters(option);
	};

	const searchBrandsHandler = (value: string) => {
		setBrandSearch(value);
	};

	return (
		<Accordion heading="Brand">
			<Input
				icon={<SearchIcon size={20} />}
				onChange={(e) => searchBrandsHandler(e.target.value)}
				placeholder="Search brands"
				value={brandsSearch}
			/>
			<ul className="px-4 mt-4">
				{filteredOptions.map(({ label, amount }) => (
					<li className="mb-4" key={label}>
						<FilterCheckboxOption
							amount={amount}
							checked={isFilterActive(label)}
							disabled={!amount}
							label={label}
							onCheck={selectHandler}
						/>
					</li>
				))}
			</ul>
		</Accordion>
	);
};
