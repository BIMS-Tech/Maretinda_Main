'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { type ReactNode, useId, useState } from 'react';

import { SPRING } from '@/components/motion';
import { cn } from '@/lib/utils';

/** One filter: folds away, and says how many of its choices are on. */
export function FilterSection({
	title,
	active = 0,
	onClear,
	clearLabel,
	defaultOpen = true,
	children,
}: {
	title: string;
	active?: number;
	onClear?: () => void;
	clearLabel: string;
	defaultOpen?: boolean;
	children: ReactNode;
}) {
	const [open, setOpen] = useState(defaultOpen || active > 0);
	const id = useId();
	return (
		<section className="border-b border-[#F0ECF4] py-4 last:border-0">
			<div className="flex items-center gap-2">
				<button
					aria-controls={id}
					aria-expanded={open}
					className="flex flex-1 items-center gap-2 text-left text-[13px] font-bold text-[#1B1B1B]"
					onClick={() => setOpen((o) => !o)}
					type="button"
				>
					{title}
					<AnimatePresence>
						{active > 0 && (
							<m.span
								animate={{ opacity: 1, scale: 1 }}
								className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#432C63] px-1.5 text-[10.5px] font-bold text-white"
								exit={{ opacity: 0, scale: 0.4 }}
								initial={{ opacity: 0, scale: 0.4 }}
								transition={SPRING}
							>
								{active}
							</m.span>
						)}
					</AnimatePresence>
				</button>
				{active > 0 && onClear && (
					<button className="text-[12px] font-semibold text-[#432C63] hover:underline" onClick={onClear} type="button">
						{clearLabel}
					</button>
				)}
				<button aria-hidden="true" className="p-1 text-[#A39DAC]" onClick={() => setOpen((o) => !o)} tabIndex={-1} type="button">
					<svg className={cn('transition-transform duration-300 ease-soft', open && 'rotate-180')} fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24" width="14">
						<path d="M6 9l6 6 6-6" />
					</svg>
				</button>
			</div>
			<div
				className={cn(
					'grid transition-[grid-template-rows,opacity] duration-400 ease-soft',
					open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
				)}
				id={id}
			>
				<div className="min-h-0 overflow-hidden" inert={!open}>
					<div className="pt-3">{children}</div>
				</div>
			</div>
		</section>
	);
}

/** A tick that draws itself. */
export const Tick = ({ on }: { on: boolean }) => (
	<span
		aria-hidden="true"
		className={cn(
			'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors duration-200',
			on ? 'border-[#432C63] bg-[#432C63]' : 'border-[#D6D0DE] bg-white group-hover:border-[#432C63]',
		)}
	>
		<svg fill="none" height="11" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.6" viewBox="0 0 24 24" width="11">
			<path
				d="M5 13l4 4L19 7"
				style={{ strokeDasharray: 24, strokeDashoffset: on ? 0 : 24, transition: 'stroke-dashoffset .28s cubic-bezier(.16,1,.3,1)' }}
			/>
		</svg>
	</span>
);

export const Switch = ({ on }: { on: boolean }) => (
	<span aria-hidden="true" className={cn('relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-300', on ? 'bg-[#432C63]' : 'bg-[#DDD7E5]')}>
		<span
			className={cn(
				'absolute left-[3px] top-[3px] h-4 w-4 rounded-full bg-white shadow transition-transform duration-300 ease-spring',
				on && 'translate-x-4',
			)}
		/>
	</span>
);
