'use client';

import { MagnifyingGlass, Minus } from '@medusajs/icons';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRefinementList } from 'react-instantsearch';

import { Button, Chip, Input, StarRating } from '@/components/atoms';
import { Accordion, FilterCheckboxOption, Modal } from '@/components/molecules';
import { ColorCheckboxOption } from '@/components/molecules/ColorCheckboxOption/ColorCheckboxOption';
import useFilters from '@/hooks/useFilters';
import useGetAllSearchParams from '@/hooks/useGetAllSearchParams';
import useUpdateSearchParams from '@/hooks/useUpdateSearchParams';
import { cn } from '@/lib/utils';

import { ProductListingActiveFilters } from '../ProductListingActiveFilters/ProductListingActiveFilters';

export const AlgoliaProductSidebar = ({
	isModal = false,
}: {
	isModal?: boolean;
}) => {
	const { allSearchParams } = useGetAllSearchParams();

	return (
		<div className="flex flex-col gap-12">
			<ProductListingActiveFilters />
			<StoreFilter
				defaultOpen={!isModal || Boolean(allSearchParams.store)}
			/>
			<BrandFilter
				defaultOpen={!isModal || Boolean(allSearchParams.brand)}
			/>
			<PriceFilter
				defaultOpen={
					!isModal ||
					Boolean(
						allSearchParams.min_price || allSearchParams.max_price,
					)
				}
			/>
			<ConditionFilter
				defaultOpen={!isModal || Boolean(allSearchParams.condition)}
			/>
			<SizeFilter
				defaultOpen={!isModal || Boolean(allSearchParams.size)}
			/>
			<ColorFilter
				defaultOpen={!isModal || Boolean(allSearchParams.color)}
			/>
			{/* <RatingFilter defaultOpen={!isModal || Boolean(allSearchParams.rating)} /> */}
		</div>
	);
};

function BrandFilter({ defaultOpen = true }: { defaultOpen?: boolean }) {
	const { items } = useRefinementList({
		attribute: 'brand.name',
		limit: 100,
		operator: 'or',
	});

	const { updateFilters, isFilterActive } = useFilters('brand');

	const selectHandler = (option: string) => {
		updateFilters(option);
	};

	return (
		<Accordion defaultOpen={defaultOpen} filter heading="Brand">
			<Input icon={<MagnifyingGlass />} placeholder="Search" />
			<ul className="mt-8">
				{items.map(({ label, count }) => (
					<li className="mb-3" key={label}>
						<FilterCheckboxOption
							checked={isFilterActive(label)}
							disabled={Boolean(!count)}
							label={label}
							onCheck={selectHandler}
						/>
					</li>
				))}
			</ul>
		</Accordion>
	);
}

function ConditionFilter({ defaultOpen = true }: { defaultOpen?: boolean }) {
	const { items } = useRefinementList({
		attribute: 'variants.condition',
		limit: 100,
		operator: 'or',
	});
	const { updateFilters, isFilterActive } = useFilters('condition');

	const selectHandler = (option: string) => {
		updateFilters(option);
	};
	return (
		<Accordion defaultOpen={defaultOpen} filter heading="Condition">
			<ul>
				{items.map(({ label, count }) => (
					<li className="mb-3" key={label}>
						<FilterCheckboxOption
							checked={isFilterActive(label)}
							disabled={Boolean(!count)}
							label={label}
							onCheck={selectHandler}
						/>
					</li>
				))}
			</ul>
		</Accordion>
	);
}

function ColorFilter({ defaultOpen = true }: { defaultOpen?: boolean }) {
	const { items } = useRefinementList({
		attribute: 'variants.color',
		escapeFacetValues: false,
		limit: 100,
		operator: 'and',
		sortBy: ['isRefined', 'count', 'name'],
	});
	const { updateFilters, isFilterActive } = useFilters('color');

	const selectHandler = (option: string) => {
		updateFilters(option);
	};

	return (
		<Accordion defaultOpen={defaultOpen} filter heading="Color">
			<ul className="px-4 flex gap-6 flex-wrap">
				{items.map(({ label, count }) => (
					<li
						className="flex items-center justify-between"
						key={label}
					>
						<ColorCheckboxOption
							checked={isFilterActive(label.toLowerCase())}
							color={label.toLowerCase()}
							disabled={Boolean(!count)}
							onCheck={selectHandler}
						/>
					</li>
				))}
			</ul>
		</Accordion>
	);
}

function SizeFilter({ defaultOpen = true }: { defaultOpen?: boolean }) {
	const { items } = useRefinementList({
		attribute: 'variants.size',
		limit: 100,
		operator: 'or',
	});
	const { updateFilters, isFilterActive } = useFilters('size');

	const selectSizeHandler = (size: string) => {
		updateFilters(size);
	};

	items.sort(
		({ label: labelA }, { label: labelB }) =>
			Number(labelA) - Number(labelB),
	);

	return (
		<Accordion defaultOpen={defaultOpen} filter heading="Size">
			<ul className="flex gap-[11px] flex-wrap">
				{items.map(({ label }) => (
					<li key={label}>
						<Chip
							className="!py-[10px] !px-5 !font-medium !rounded-[6px] border-none"
							onSelect={() => selectSizeHandler(label)}
							selected={isFilterActive(label)}
							value={label}
						/>
					</li>
				))}
			</ul>
		</Accordion>
	);
}

function PriceFilter({ defaultOpen = true }: { defaultOpen?: boolean }) {
	const [min, setMin] = useState('');
	const [max, setMax] = useState('');

	const updateSearchParams = useUpdateSearchParams();
	const searchParams = useSearchParams();
	const { isFilterActive } = useFilters('max_price');

	useEffect(() => {
		setMin(searchParams.get('min_price') || '');
		setMax(searchParams.get('max_price') || '');
	}, [searchParams]);

	const priceChangeHandler = (field: string, value: string) => {
		const reg = /^[0-9]+$/;
		if (reg.test(value)) {
			if (field === 'min') setMin(value);
			if (field === 'max') setMax(value);
		}
	};

	const updatePriceHandler = () => {
		updateSearchParams(['min_price', 'max_price'], [min, max]);
	};

	const maxPriceList = [100, 1000, 5000];

	const selectMaxPriceHandler = (option: string) => {
		if (isFilterActive(option)) {
			updateSearchParams('max_price', null);
		} else {
			updateSearchParams('max_price', option);
		}
	};

	return (
		<Accordion defaultOpen={defaultOpen} filter heading="Price">
			<div className="mb-4">
				<ul>
					{maxPriceList.map((maxPrice) => (
						<li className="mb-3" key={maxPrice}>
							<FilterCheckboxOption
								checked={isFilterActive(maxPrice.toString())}
								label={`0 - $ ${maxPrice.toLocaleString()}.00`}
								onCheck={selectMaxPriceHandler}
								value={maxPrice.toString()}
							/>
						</li>
					))}
				</ul>
				<div className="mt-6 mb-[1px] flex items-stretch">
					<Input
						className="bg-white text-black py-[9px] text-center max-w-[76px]"
						onChange={(e) =>
							priceChangeHandler('min', e.target.value)
						}
						placeholder="Min"
						value={min}
					/>
					<div className="flex items-center">
						<Minus className="mx-[6px]" height={15} width={15} />
					</div>
					<Input
						className="bg-white text-black py-[9px] text-center max-w-[72px]"
						onChange={(e) =>
							priceChangeHandler('max', e.target.value)
						}
						placeholder="Max"
						value={max}
					/>
					<Button
						className="ml-[13px] mt-2 mr-2 text-white !bg-[rgba(var(--brand-purple-500))] font-medium"
						onClick={() => {
							updatePriceHandler();
						}}
						type="button"
					>
						Apply
					</Button>
				</div>
			</div>
		</Accordion>
	);
}

function StoreFilter({ defaultOpen = true }: { defaultOpen?: boolean }) {
	const { items } = useRefinementList({
		attribute: 'seller.handle',
		limit: 100,
		operator: 'or',
	});
	const { updateFilters, isFilterActive } = useFilters('store');

	const selectHandler = (option: string) => {
		updateFilters(option);
	};

	return (
		<Accordion defaultOpen={defaultOpen} filter heading="Store">
			<Input icon={<MagnifyingGlass />} placeholder="Search" />
			<ul className="mt-8">
				{items.map(({ label, count }) => (
					<li className="mb-3" key={label}>
						<FilterCheckboxOption
							checked={isFilterActive(label)}
							disabled={Boolean(!count)}
							label={label}
							onCheck={selectHandler}
						/>
					</li>
				))}
			</ul>
		</Accordion>
	);
}

// function RatingFilter({ defaultOpen = true }: { defaultOpen?: boolean }) {
// 	const { updateFilters, isFilterActive } = useFilters("rating");

// 	const selectHandler = (option: string) => {
// 		updateFilters(option);
// 	};

// 	return (
// 		<Accordion heading="Rating" defaultOpen={defaultOpen} filter>
// 			<ul className="px-4">
// 				{filters.map(({ label }) => (
// 					<li
// 						className={cn("mb-4 flex items-center gap-2 cursor-pointer")}
// 						key={label}
// 						onClick={() => selectHandler(label)}
// 					>
// 						<FilterCheckboxOption
// 							checked={isFilterActive(label)}
// 							label={label}
// 						/>
// 						<StarRating rate={+label} />
// 					</li>
// 				))}
// 			</ul>
// 		</Accordion>
// 	);
// }
