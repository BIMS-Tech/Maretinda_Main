'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Input } from '@/components/atoms';
import { Accordion, FilterCheckboxOption } from '@/components/molecules';
import useFilters from '@/hooks/useFilters';
import useUpdateSearchParams from '@/hooks/useUpdateSearchParams';
import { DollarIcon } from '@/icons';

export const PriceFilter = () => {
	const [min, setMin] = useState('');
	const [max, setMax] = useState('');

	const updateSearchParams = useUpdateSearchParams();
	const { updateFilters } = useFilters('sale');
	const searchParams = useSearchParams();

	const selected = searchParams.get('sale');

	useEffect(() => {
		setMin(searchParams.get('min_price') || '');
		setMax(searchParams.get('max_price') || '');
	}, [searchParams]);

	const selectHandler = (option: string) => {
		updateFilters(option);
	};

	const priceChangeHandler = (field: string, value: string) => {
		const reg = /^[0-9]+$/;
		if (reg.test(value)) {
			if (field === 'min') setMin(value);
			if (field === 'max') setMax(value);
		}
	};

	const updateMinPriceHandler = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		updateSearchParams('min_price', min);
	};

	const updateMaxPriceHandler = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		updateSearchParams('max_price', max);
	};

	return (
		<Accordion heading="Price">
			<div className="flex gap-2 mb-4">
				<form method="POST" onSubmit={updateMinPriceHandler}>
					<Input
						icon={<DollarIcon size={16} />}
						onChange={(e) =>
							priceChangeHandler('min', e.target.value)
						}
						placeholder="Min"
						value={min}
					/>
					<input className="hidden" type="submit" />
				</form>
				<form method="POST" onSubmit={updateMaxPriceHandler}>
					<Input
						icon={<DollarIcon size={16} />}
						onChange={(e) =>
							priceChangeHandler('max', e.target.value)
						}
						placeholder="Max"
						value={max}
					/>
					<input className="hidden" type="submit" />
				</form>
			</div>
			{/* <div className='px-4'>
        <FilterCheckboxOption
          checked={Boolean(selected)}
          onCheck={selectHandler}
          label={'On Sale'}
        />
      </div> */}
		</Accordion>
	);
};
