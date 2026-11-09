'use client';

import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

import { CollapseIcon, TickThinIcon } from '@/icons';
import { cn } from '@/lib/utils';

export const SelectField = ({
	options,
	className = '',
	selected,
	selectOption,
	placeholder = '',
	full = false,
	label,
}: {
	options: {
		value?: string;
		label?: string;
		hidden?: boolean;
	}[];
	placeholder?: string;
	className?: string;
	selected?: string | number | readonly string[];
	selectOption?: (value: string) => void;
	full?: boolean;
	/** Names the control for screen readers, e.g. "Sort by" */
	label?: string;
}) => {
	const [selectedOption, setSelectedOption] = useState(
		options.find(({ value }) => value === selected)?.label ||
			options[0].label,
	);
	const [open, setOpen] = useState(false);

	const selectRef = useRef<HTMLDivElement>(null);

	// Close on clicks outside the field. Clicks on the chevron or label inside
	// it used to count as outside and shut the list as soon as it opened.
	useEffect(() => {
		const closeOutside = (e: MouseEvent) => {
			if (!selectRef.current?.contains(e.target as Node)) setOpen(false);
		};
		window.addEventListener('click', closeOutside);
		return () => window.removeEventListener('click', closeOutside);
	}, []);

	const selectOptionHandler = (label?: string, value?: string) => {
		setSelectedOption(label);
		if (selectOption && value) selectOption(value);
		setOpen(false);
	};

	return (
		<div className={`relative ${full ? 'w-full' : ''}`} ref={selectRef}>
			<button
				aria-expanded={open}
				aria-haspopup="listbox"
				aria-label={label ? `${label}: ${selectedOption || placeholder}` : undefined}
				className={cn(
					'relative rounded-sm border px-3 py-2 bg-component-secondary label-md cursor-pointer h-12 flex gap-2 items-center',
					open && 'border-primary',
					className,
				)}
				onClick={() => setOpen(!open)}
				type="button"
			>
				{selectedOption || placeholder}
				<CollapseIcon
					className={clsx('transition', {
						'rotate-180': open,
					})}
					size={20}
				/>
			</button>
			{open && (
				<ul role="listbox" className="absolute border border-black/15 bg-component-secondary rounded-sm min-w-full w-max max-w-[80vw] right-0 top-[47px] z-50 shadow-lg">
					{options.map(
						({ label, value, hidden }, index) =>
							!hidden && (
								<li
									aria-selected={label === selectedOption}
									role="option"
									className={cn(
										'relative label-md py-2 px-3 hover:bg-component-secondary-hover text-black cursor-pointer',
										index === 0 && 'rounded-t-sm',
										index === options.length - 1 &&
											'rounded-b-sm',
									)}
									key={value}
									onClick={() =>
										selectOptionHandler(label, value)
									}
								>
									{label === selectedOption && (
										<TickThinIcon
											className="absolute top-[10px] left-2"
											size={20}
										/>
									)}
									<span className="ml-5 whitespace-nowrap">{label}</span>
								</li>
							),
					)}
				</ul>
			)}
		</div>
	);
};
