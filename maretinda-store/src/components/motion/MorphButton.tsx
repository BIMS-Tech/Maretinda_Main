'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { EASE_OUT } from './tokens';

export type MorphState = 'idle' | 'busy' | 'done';

const Spin = () => (
	<span aria-hidden="true" className="h-[15px] w-[15px] animate-spin rounded-full border-2 border-current border-r-transparent" />
);

const Tick = () => (
	<svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" width="16">
		<m.path animate={{ pathLength: 1 }} d="M5 13l4 4L19 7" initial={{ pathLength: 0 }} transition={{ delay: 0.08, duration: 0.3, ease: EASE_OUT }} />
	</svg>
);

/** A button whose label rolls from what it does, to doing it, to done. */
export function MorphButton({
	state,
	idle,
	busy,
	done,
	className,
	...props
}: {
	state: MorphState;
	idle: ReactNode;
	busy: ReactNode;
	done: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			{...props}
			aria-busy={state === 'busy' || undefined}
			className={cn('press relative overflow-hidden', className)}
			disabled={props.disabled || state === 'busy'}
		>
			<AnimatePresence initial={false} mode="popLayout">
				<m.span
					animate={{ opacity: 1, y: 0 }}
					className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
					exit={{ opacity: 0, y: -16 }}
					initial={{ opacity: 0, y: 16 }}
					key={state}
					transition={{ duration: 0.28, ease: EASE_OUT }}
				>
					{state === 'busy' && <Spin />}
					{state === 'done' && <Tick />}
					{state === 'busy' ? busy : state === 'done' ? done : idle}
				</m.span>
			</AnimatePresence>
		</button>
	);
}
