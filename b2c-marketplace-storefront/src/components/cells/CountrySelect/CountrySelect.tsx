import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDown } from '@medusajs/icons';
import type { HttpTypes } from '@medusajs/types';
import { clx } from '@medusajs/ui';
import clsx from 'clsx';
import {
	Fragment,
	forwardRef,
	useImperativeHandle,
	useMemo,
	useRef,
} from 'react';
import type { FieldError } from 'react-hook-form';

import NativeSelect, {
	type NativeSelectProps,
} from '@/components/molecules/NativeSelect/NativeSelect';

const CountrySelect = forwardRef<
	HTMLSelectElement,
	NativeSelectProps & {
		error?: FieldError;
		region?: HttpTypes.StoreRegion;
	}
>(({ error, placeholder = 'Country', region, defaultValue, ...props }, ref) => {
	const innerRef = useRef<HTMLSelectElement>(null);

	useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
		ref,
		() => innerRef.current,
	);

	const countryOptions = useMemo(() => {
		if (!region) {
			return [];
		}

		return region.countries?.map((country) => ({
			label: country.display_name,
			value: country.iso_2,
		}));
	}, [region]);

	const handleSelect = (value: string) => {
		props.onChange?.({
			target: {
				name: props.name,
				value,
			},
		} as React.ChangeEvent<HTMLSelectElement>);
	};

	// Normalize value to string for Listbox
	const normalizedValue =
		typeof props.value === 'string'
			? props.value
			: Array.isArray(props.value)
				? props.value[0]
				: props.value !== undefined
					? String(props.value)
					: undefined;

	return (
		<label className="label-md block">
			<p className={clsx('mb-2', error && 'text-negative')}>
				Country/Region<span className="text-red-500/50">*</span>
			</p>
			<Listbox onChange={handleSelect} value={normalizedValue}>
				<div className="relative">
					<Listbox.Button
						className={clsx(
							'relative w-full flex justify-between items-center px-4 h-12 bg-component-secondary text-left  cursor-default focus:outline-none border rounded-lg focus-visible:ring-2 focus-visible:ring-opacity-75 focus-visible:ring-white focus-visible:ring-offset-gray-300 focus-visible:ring-offset-2 focus-visible:border-gray-300 text-base-regular',
							'focus:border-[#2563EB] focus:outline-none focus:ring-2 border border-black/10 bg-white',
						)}
						data-testid="shipping-address-select"
					>
						{({ open }) => (
							<>
								<span className="block truncate">
									{countryOptions?.find(
										(country) =>
											country.value === normalizedValue,
									)?.label || 'Choose a country'}
								</span>
								<ChevronUpDown
									className={clx(
										'transition-rotate duration-200',
										{
											'transform rotate-180': open,
										},
									)}
								/>
							</>
						)}
					</Listbox.Button>
					<Transition
						as={Fragment}
						leave="transition ease-in duration-100"
						leaveFrom="opacity-100"
						leaveTo="opacity-0"
					>
						<Listbox.Options
							className="absolute z-20 w-full overflow-auto text-small-regular bg-white border rounded-lg border-top-0 max-h-60 focus:outline-none sm:text-sm"
							data-testid="shipping-address-options"
						>
							{countryOptions?.map(({ value, label }, index) => (
								<Listbox.Option
									className="cursor-default select-none relative pl-6 pr-10 hover:bg-gray-50 py-4 border-b"
									data-testid="shipping-address-option"
									key={index}
									value={value}
								>
									{label}
								</Listbox.Option>
							))}
						</Listbox.Options>
					</Transition>
				</div>
			</Listbox>
			<div className="hidden">
				<NativeSelect
					className={clsx(
						'hidden w-full h-12 items-center bg-component-secondary',
					)}
					defaultValue={defaultValue}
					placeholder={placeholder}
					ref={innerRef}
					{...props}
				>
					{countryOptions?.map(({ value, label }, index) => (
						<option key={index} value={value}>
							{label}
						</option>
					))}
				</NativeSelect>
			</div>
		</label>
	);
});

CountrySelect.displayName = 'CountrySelect';

export default CountrySelect;
