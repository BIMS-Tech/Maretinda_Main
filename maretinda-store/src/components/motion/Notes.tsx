'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';

import { dismissNote, useCartFeedback } from '@/lib/cart-feedback';
import { cn } from '@/lib/utils';

import { SPRING_SOFT } from './tokens';

/** Short notes at the bottom of the screen: "Barong added to your cart". */
export const Notes = () => {
	const { notes } = useCartFeedback();
	return (
		<div
			aria-live="polite"
			className="pointer-events-none fixed inset-x-0 bottom-5 z-[120] flex justify-center px-4"
			role="status"
		>
			<AnimatePresence mode="popLayout">
				{notes.map((note) => (
					<m.div
						animate={{ opacity: 1, scale: 1, y: 0 }}
						className="pointer-events-auto flex max-w-[min(94vw,520px)] items-center gap-3 rounded-full bg-[#1E1430] py-2 pl-3 pr-2 text-white shadow-[0_16px_44px_rgba(30,20,48,0.35)]"
						data-testid="note"
						exit={{ opacity: 0, scale: 0.94, y: 16 }}
						initial={{ opacity: 0, scale: 0.9, y: 28 }}
						key={note.id}
						layout
						transition={SPRING_SOFT}
					>
						<span
							className={cn(
								'pop-in flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
								note.tone === 'error' ? 'bg-[#D94040]' : 'bg-[#1F7A4D]',
							)}
							style={{ '--delay': '120ms' } as React.CSSProperties}
						>
							<svg aria-hidden="true" fill="none" height="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" width="13">
								<path d={note.tone === 'error' ? 'M12 7v6M12 17h.01' : 'M5 13l4 4L19 7'} />
							</svg>
						</span>
						<span className="min-w-0 truncate text-[13px] font-medium">{note.title}</span>
						{note.action ? (
							<button
								className="press h-8 shrink-0 rounded-full bg-white px-3.5 text-[12.5px] font-bold text-[#1E1430]"
								onClick={() => {
									note.action?.onClick();
									dismissNote(note.id);
								}}
								type="button"
							>
								{note.action.label}
							</button>
						) : (
							<button
								aria-label="Dismiss"
								className="press flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/60 hover:text-white"
								onClick={() => dismissNote(note.id)}
								type="button"
							>
								<svg aria-hidden="true" fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" viewBox="0 0 24 24" width="14">
									<path d="M6 6l12 12M18 6L6 18" />
								</svg>
							</button>
						)}
					</m.div>
				))}
			</AnimatePresence>
		</div>
	);
};
