'use client';

import {
	Combobox,
	ComboboxButton,
	ComboboxInput,
	ComboboxOption,
	ComboboxOptions,
	Field,
	Label,
} from '@headlessui/react';
import { ChevronUpDown } from '@medusajs/icons';
import { useMemo, useState } from 'react';
import type { FieldError } from 'react-hook-form';

import { matchesSearch } from '@/lib/helpers/ph-locations';
import { cn } from '@/lib/utils';

export const SearchableSelect = ({
	disabled,
	error,
	important,
	label,
	labelClassName,
	name,
	onChange,
	options,
	placeholder,
	required,
	testId,
	value,
}: {
	disabled?: boolean;
	error?: FieldError;
	important?: boolean;
	label: string;
	labelClassName?: string;
	name?: string;
	onChange: (value: string) => void;
	options: string[];
	placeholder?: string;
	required?: boolean;
	testId?: string;
	value?: string;
}) => {
	const [query, setQuery] = useState('');

	// A saved address can hold free text that isn't in the list. Keep it
	// selectable so opening the form doesn't lose it.
	const allOptions = useMemo(
		() =>
			value && !options.includes(value) ? [value, ...options] : options,
		[options, value],
	);
	const visible = allOptions.filter((option) => matchesSearch(option, query));

	return (
		<Field className="label-sm block" disabled={disabled}>
			<Label
				className={cn('block', error && 'text-negative', labelClassName)}
			>
				{label}
				{important && <span className="text-red-500/50">*</span>}
			</Label>
			<Combobox
				immediate
				name={name}
				onChange={(next: string | null) => onChange(next ?? '')}
				onClose={() => setQuery('')}
				value={value ?? ''}
			>
				<div className="relative mt-2">
					<ComboboxInput
						autoComplete="off"
						className={cn(
							'label-md w-full px-[16px] py-[12px] pr-10 border rounded-sm bg-white border-black/10 focus:border-[#2563EB] focus:outline-none focus:ring-2 data-[disabled]:bg-disabled data-[disabled]:cursor-not-allowed',
							error && 'border-negative',
						)}
						data-testid={testId}
						displayValue={(option: string) => option}
						onChange={(event) => setQuery(event.target.value)}
						placeholder={placeholder}
						required={required}
					/>
					<ComboboxButton
						aria-label={`Show ${label} options`}
						className="absolute inset-y-0 right-0 flex items-center px-3 data-[disabled]:cursor-not-allowed"
					>
						<ChevronUpDown />
					</ComboboxButton>
				</div>
				<ComboboxOptions
					anchor="bottom start"
					className="z-[80] w-[var(--input-width)] max-h-60 overflow-auto rounded-sm border border-black/10 bg-white shadow-lg [--anchor-gap:4px] [--anchor-max-height:15rem] empty:invisible"
					modal={false}
				>
					{visible.length === 0 ? (
						<p className="px-4 py-3 text-sm text-black/60">
							No matches
						</p>
					) : (
						visible.map((option) => (
							<ComboboxOption
								className="cursor-default select-none label-md px-4 py-3 data-[focus]:bg-gray-100 data-[selected]:font-semibold"
								key={option}
								value={option}
							>
								{option}
							</ComboboxOption>
						))
					)}
				</ComboboxOptions>
			</Combobox>
			{error && <p className="label-sm text-negative">{error.message}</p>}
		</Field>
	);
};
