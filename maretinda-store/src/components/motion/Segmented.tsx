'use client';

import * as m from 'motion/react-m';
import { type ReactNode, useId } from 'react';

import { cn } from '@/lib/utils';

import { SPRING } from './tokens';

export type SegmentedOption<T extends string> = { value: T; label: ReactNode; testId?: string };

/** A row of choices with a pill that slides to the one picked. */
export function Segmented<T extends string>({
	options,
	value,
	onChange,
	label,
	className,
	tone = 'dark',
	size = 'md',
	stretch = false,
}: {
	options: SegmentedOption<T>[];
	value: T;
	onChange: (value: T) => void;
	label: string;
	className?: string;
	tone?: 'dark' | 'light';
	size?: 'sm' | 'md';
	stretch?: boolean;
}) {
	const id = useId();
	return (
		<div
			aria-label={label}
			className={cn(
				'relative inline-flex items-center gap-0.5 rounded-full p-1 max-w-full overflow-x-auto no-scrollbar',
				tone === 'dark' ? 'bg-white border border-[#EDEAE3]' : 'bg-[#F1EDF6]',
				stretch && 'flex w-full',
				className,
			)}
			role="tablist"
		>
			{options.map((option) => {
				const active = option.value === value;
				return (
					<button
						aria-selected={active}
						className={cn(
							'relative shrink-0 rounded-full font-semibold whitespace-nowrap transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#432C63]',
							size === 'sm' ? 'h-8 px-3.5 text-[12.5px]' : 'h-9 px-4 text-[13px]',
							stretch && 'flex-1',
							active ? (tone === 'dark' ? 'text-white' : 'text-[#1B1B1B]') : 'text-[#5B5B5B] hover:text-[#1B1B1B]',
						)}
						data-testid={option.testId}
						key={option.value}
						onClick={() => onChange(option.value)}
						role="tab"
						type="button"
					>
						{active && (
							<m.span
								className={cn('absolute inset-0 rounded-full', tone === 'dark' ? 'bg-[#432C63]' : 'bg-white shadow-sm')}
								layoutId={`segmented-${id}`}
								transition={SPRING}
							/>
						)}
						<span className="relative">{option.label}</span>
					</button>
				);
			})}
		</div>
	);
}
