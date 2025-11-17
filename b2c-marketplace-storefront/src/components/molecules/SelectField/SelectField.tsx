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
}) => {
	const [selectedOption, setSelectedOption] = useState(
		options.find(({ value }) => value === selected)?.label ||
			options[0].label,
	);
	const [open, setOpen] = useState(false);

	const selectRef = useRef(null);

	useEffect(() => {
		window.addEventListener('click', (e) => {
			if (selectRef.current && selectRef.current !== e.target)
				setOpen(false);
		});

		return window.removeEventListener('click', () => null);
	}, []);

	const selectOptionHandler = (label?: string, value?: string) => {
		setSelectedOption(label);
		if (selectOption && value) selectOption(value);
		setOpen(false);
	};

	return (
		<div className={`relative ${full ? 'w-full' : ''}`}>
			<div
				className={cn(
					'relative rounded-sm border px-3 py-2 bg-component-secondary label-md cursor-pointer h-12 flex gap-2 items-center',
					open && 'border-primary',
					className,
				)}
				onClick={() => setOpen(!open)}
				ref={selectRef}
			>
				{selectedOption || placeholder}
				<CollapseIcon
					className={clsx('transition', {
						'rotate-180': open,
					})}
					size={20}
				/>
			</div>
			{open && (
				<ul className="absolute border border-black/15 bg-component-secondary rounded-sm w-full top-[47px] z-10">
					{options.map(
						({ label, value, hidden }, index) =>
							!hidden && (
								<li
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
									<span className="ml-5">{label}</span>
								</li>
							),
					)}
				</ul>
			)}
		</div>
	);
};
