'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import type { ReactNode } from 'react';

import { SPRING } from '@/components/motion';
import { cn } from '@/lib/utils';

/** A numbered step of the checkout; its number turns into a tick when it's done. */
export function CheckoutStepHeader({ n, title, done, open, onEdit }: { n: number; title: string; done: boolean; open: boolean; onEdit: () => void }) {
	const ticked = done && !open;
	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-3">
				<span
					className={cn(
						'relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-[13px] font-bold transition-colors duration-300',
						ticked ? 'bg-[#1F7A4D] text-white' : open ? 'bg-[#432C63] text-white' : 'bg-[#F1EDF6] text-[#432C63]',
					)}
				>
					<AnimatePresence initial={false} mode="popLayout">
						<m.span animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.4 }} initial={{ opacity: 0, scale: 0.4 }} key={ticked ? 'tick' : 'n'} transition={SPRING}>
							{ticked ? (
								<svg aria-label="Done" fill="none" height="15" role="img" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" viewBox="0 0 24 24" width="15">
									<m.path animate={{ pathLength: 1 }} d="M5 13l4 4L19 7" initial={{ pathLength: 0 }} transition={{ delay: 0.1, duration: 0.3 }} />
								</svg>
							) : (
								n
							)}
						</m.span>
					</AnimatePresence>
				</span>
				<h2 className="text-[19px] font-bold text-[#111827]">{title}</h2>
			</div>
			<AnimatePresence initial={false}>
				{ticked && (
					<m.button
						animate={{ opacity: 1, x: 0 }}
						className="press rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-[#432C63] hover:bg-[#F6F2FB]"
						exit={{ opacity: 0, x: 8 }}
						initial={{ opacity: 0, x: 8 }}
						onClick={onEdit}
						type="button"
					>
						Edit
					</m.button>
				)}
			</AnimatePresence>
		</div>
	);
}

/** One of a set of choices. Its outline slides here from the last one picked. */
export function Choice({
	group,
	selected,
	onSelect,
	icon,
	title,
	detail,
	aside,
	disabled,
	testId,
}: {
	/** Choices sharing a group share an outline */
	group: string;
	selected: boolean;
	onSelect: () => void;
	icon?: ReactNode;
	title: string;
	detail?: ReactNode;
	aside?: ReactNode;
	disabled?: boolean;
	testId?: string;
}) {
	return (
		<button
			aria-checked={selected}
			className={cn(
				'press relative flex min-h-[60px] w-full items-center gap-3.5 rounded-[18px] px-4 py-3 text-left transition-colors duration-200 disabled:opacity-60',
				selected ? 'bg-white' : 'bg-[#F8F5FB] hover:bg-[#F1EDF6]',
			)}
			data-testid={testId}
			disabled={disabled}
			onClick={onSelect}
			role="radio"
			type="button"
		>
			{selected && <m.span className="absolute inset-0 rounded-[18px] border-2 border-[#432C63] bg-[#432C63]/[0.03]" layoutId={`choice-${group}`} transition={SPRING} />}
			{icon && <span className="relative flex shrink-0 items-center justify-center">{icon}</span>}
			<span className="relative min-w-0 flex-1">
				<span className="block text-[14px] font-semibold text-[#111827]">{title}</span>
				{detail && <span className="block text-[12.5px] text-[#737373]">{detail}</span>}
			</span>
			{aside && <span className="relative shrink-0 text-[14px] font-bold text-[#432C63]">{aside}</span>}
		</button>
	);
}
