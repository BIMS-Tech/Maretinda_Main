'use client';

import {
	Listbox,
	ListboxButton,
	ListboxOption,
	ListboxOptions,
	Transition,
} from '@headlessui/react';
import type { HttpTypes } from '@medusajs/types';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { Fragment, useEffect, useMemo, useState } from 'react';
import ReactCountryFlag from 'react-country-flag';

import { updateRegion } from '@/lib/data/cart';

type CountryOption = {
	country: string;
	region: string;
	label: string;
};

type CountrySelectProps = {
	regions: HttpTypes.StoreRegion[];
};

const CountrySelect = ({ regions }: CountrySelectProps) => {
	const [current, setCurrent] = useState<CountryOption | undefined>(undefined);

	const { locale: countryCode } = useParams();
	const currentPath = usePathname().split(`/${countryCode}`)[1];

	const options = useMemo(() => {
		return regions
			?.flatMap((r) => {
				return r.countries
					?.map((c) => ({
						country: c.iso_2,
						label: c.display_name,
						region: r.id,
					}))
					.filter((o): o is CountryOption => 
						!!o.country && !!o.label && !!o.region
					) ?? [];
			})
			.filter((o): o is CountryOption => 
				!!o.country && !!o.label && !!o.region
			)
			.sort((a, b) => a.label.localeCompare(b.label));
	}, [regions]);

	useEffect(() => {
		if (countryCode) {
			const option = options.find((o) => o.country === countryCode);
			setCurrent(option);
		}
	}, [options, countryCode]);

	const handleChange = (option: CountryOption) => {
		updateRegion(option.country, currentPath);
	};

	return (
		<div>
			<Listbox
				defaultValue={
					countryCode
						? options.find((o) => o.country === countryCode)
						: undefined
				}
				onChange={handleChange}
			>
				<ListboxButton className="relative w-20 flex justify-between items-center h-12 bg-component-secondary text-left  cursor-default focus:outline-none border rounded-lg focus-visible:ring-2 focus-visible:ring-opacity-75 focus-visible:ring-white focus-visible:ring-offset-gray-300 focus-visible:ring-offset-2 focus-visible:border-gray-300 text-base-regular">
					<div className="txt-compact-small flex items-start mx-auto">
						{current && (
							<span className="txt-compact-small flex items-center gap-x-2">
								{/* @ts-ignore */}
								<ReactCountryFlag
									countryCode={current.country}
									style={{
										height: '16px',
										width: '16px',
									}}
									svg
								/>
								{current.country.toUpperCase()}
							</span>
						)}
					</div>
				</ListboxButton>
				<div className="flex relative w-20">
					<Transition
						as={Fragment}
						leave="transition ease-in duration-150"
						leaveFrom="opacity-100"
						leaveTo="opacity-0"
					>
						<ListboxOptions className="no-scrollbar absolute z-20 overflow-auto text-small-regular bg-white border rounded-lg border-top-0 max-h-60 focus:outline-none sm:text-sm">
							{options.map((o, index) => {
								return (
									<ListboxOption
										className="cursor-default select-none relative w-20 hover:bg-gray-50 py-4 border-b"
										key={index}
										value={o}
									>
										<span className="flex items-center gap-x-2 pl-4">
											{/* @ts-ignore */}
											<ReactCountryFlag
												countryCode={o.country}
												style={{
													height: '16px',
													width: '16px',
												}}
												svg
											/>{' '}
											{o.country.toUpperCase()}
										</span>
									</ListboxOption>
								);
							})}
						</ListboxOptions>
					</Transition>
				</div>
			</Listbox>
		</div>
	);
};

export default CountrySelect;
