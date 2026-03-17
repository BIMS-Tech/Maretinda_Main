'use client';

import { useEffect, useState } from 'react';

import { Input } from '@/components/atoms';
import { Accordion, FilterCheckboxOption } from '@/components/molecules';
import useFilters from '@/hooks/useFilters';
import { SearchIcon } from '@/icons';

export type BrandOption = {
	id: string;
	title: string;
};

export const BrandFilter = ({ brands }: { brands: BrandOption[] }) => {
	const [brandsSearch, setBrandSearch] = useState('');
	const [filteredOptions, setFilteredOptions] = useState(brands);
	const { updateFilters, isFilterActive } = useFilters('brand');

	useEffect(() => {
		setFilteredOptions(
			brands.filter(({ title }) =>
				title.toLowerCase().includes(brandsSearch.toLowerCase()),
			),
		);
	}, [brandsSearch, brands]);

	const selectHandler = (option: string) => {
		updateFilters(option);
	};

	if (!brands.length) return null;

	return (
		<Accordion heading="Brand">
			<Input
				icon={<SearchIcon size={20} />}
				onChange={(e) => setBrandSearch(e.target.value)}
				placeholder="Search brands"
				value={brandsSearch}
			/>
			<ul className="px-4 mt-4">
				{filteredOptions.map(({ id, title }) => (
					<li className="mb-4" key={id}>
						<FilterCheckboxOption
							checked={isFilterActive(id)}
							label={title}
							onCheck={() => selectHandler(id)}
							value={id}
						/>
					</li>
				))}
			</ul>
		</Accordion>
	);
};
