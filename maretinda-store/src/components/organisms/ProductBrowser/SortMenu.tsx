'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';

import { EASE_OUT, SPRING } from '@/components/motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/providers/LanguageProvider';
import type { Sort } from '@/types/search';

/** The order of a listing. A listbox: arrows, Home/End, Enter and Escape all work. */
export function SortMenu({ value, onChange, searching, className }: { value: Sort; onChange: (sort: Sort) => void; searching: boolean; className?: string }) {
	const { t } = useLanguage();
	const s = t.listing;
	const options: Sort[] = [...(searching ? (['relevance'] as const) : []), 'popular', 'newest', 'best_selling', 'rating', 'discount', 'price_asc', 'price_desc'];
	const [open, setOpen] = useState(false);
	const [at, setAt] = useState(0);
	const root = useRef<HTMLDivElement>(null);
	const button = useRef<HTMLButtonElement>(null);
	const id = useId();

	useEffect(() => {
		if (!open) return;
		const away = (e: PointerEvent) => {
			if (!root.current?.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener('pointerdown', away);
		return () => document.removeEventListener('pointerdown', away);
	}, [open]);

	const show = () => {
		setAt(Math.max(0, options.indexOf(value)));
		setOpen(true);
	};
	const pick = (sort: Sort) => {
		setOpen(false);
		button.current?.focus();
		if (sort !== value) onChange(sort);
	};
	const keys = (e: KeyboardEvent) => {
		if (!open) {
			if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
				e.preventDefault();
				show();
			}
			return;
		}
		const move = { ArrowDown: Math.min(options.length - 1, at + 1), ArrowUp: Math.max(0, at - 1), End: options.length - 1, Home: 0 }[e.key];
		if (move !== undefined) {
			e.preventDefault();
			setAt(move);
		} else if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			pick(options[at]);
		} else if (e.key === 'Escape' || e.key === 'Tab') setOpen(false);
	};

	return (
		<div className={cn('relative', className)} ref={root}>
			<button
				aria-activedescendant={open ? `${id}-${options[at]}` : undefined}
				aria-controls={`${id}-list`}
				aria-expanded={open}
				aria-haspopup="listbox"
				aria-label={`${s.sortBy}: ${s.sorts[value]}`}
				className="press flex h-11 w-full items-center gap-2 rounded-full border border-[#E7E1EE] bg-white pl-4 pr-3 text-[13px] hover:border-[#432C63]"
				onClick={() => (open ? setOpen(false) : show())}
				onKeyDown={keys}
				ref={button}
				type="button"
			>
				<span className="hidden text-[#8A8493] sm:inline">{s.sortBy}</span>
				<AnimatePresence initial={false} mode="popLayout">
					<m.span
						animate={{ opacity: 1, y: 0 }}
						className="truncate font-bold text-[#1B1B1B]"
						exit={{ opacity: 0, y: -8 }}
						initial={{ opacity: 0, y: 8 }}
						key={value}
						transition={{ duration: 0.25, ease: EASE_OUT }}
					>
						{s.sorts[value]}
					</m.span>
				</AnimatePresence>
				<svg aria-hidden="true" className={cn('ml-auto shrink-0 text-[#8A8493] transition-transform duration-300', open && 'rotate-180')} fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24" width="14">
					<path d="M6 9l6 6 6-6" />
				</svg>
			</button>
			<AnimatePresence>
				{open && (
					<m.ul
						animate={{ opacity: 1, scale: 1, y: 0 }}
						className="absolute right-0 top-[calc(100%+8px)] z-30 w-[230px] origin-top-right rounded-2xl border border-[#EDE8F2] bg-white p-1.5 shadow-[0_20px_50px_-12px_rgba(42,27,62,0.28)]"
						exit={{ opacity: 0, scale: 0.97, y: -4 }}
						id={`${id}-list`}
						initial={{ opacity: 0, scale: 0.95, y: -8 }}
						role="listbox"
						transition={{ duration: 0.22, ease: EASE_OUT }}
					>
						{options.map((sort, i) => (
							// biome-ignore lint/a11y/useKeyWithClickEvents: the button above takes the keys (aria-activedescendant)
							<li
								aria-selected={sort === value}
								className={cn('relative cursor-pointer rounded-xl px-3 py-2.5 text-[13px]', sort === value ? 'font-bold text-[#432C63]' : 'text-[#404040]')}
								id={`${id}-${sort}`}
								key={sort}
								onClick={() => pick(sort)}
								onPointerMove={() => setAt(i)}
								role="option"
							>
								{i === at && <m.span className="absolute inset-0 rounded-xl bg-[#F6F2FB]" layoutId={`${id}-at`} transition={SPRING} />}
								<span className="relative flex items-center justify-between">
									{s.sorts[sort]}
									{sort === value && (
										<svg aria-hidden="true" className="pop-in" fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" width="14">
											<path d="M5 13l4 4L19 7" />
										</svg>
									)}
								</span>
							</li>
						))}
					</m.ul>
				)}
			</AnimatePresence>
		</div>
	);
}
