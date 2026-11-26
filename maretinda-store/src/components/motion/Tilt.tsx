'use client';

import { type PointerEvent, type ReactNode, useRef } from 'react';

import { cn } from '@/lib/utils';

import { prefersReducedMotion } from './tokens';

/** Leans gently towards the pointer. Mouse only: a finger would cover it. */
export function Tilt({ children, className, max = 5, lift = 10 }: { children: ReactNode; className?: string; max?: number; lift?: number }) {
	const ref = useRef<HTMLDivElement>(null);
	const move = (e: PointerEvent) => {
		const el = ref.current;
		if (!el || e.pointerType !== 'mouse' || prefersReducedMotion()) return;
		const box = el.getBoundingClientRect();
		const x = (e.clientX - box.left) / box.width - 0.5;
		const y = (e.clientY - box.top) / box.height - 0.5;
		el.style.setProperty('--rx', `${(-y * max).toFixed(2)}deg`);
		el.style.setProperty('--ry', `${(x * max).toFixed(2)}deg`);
		el.style.setProperty('--tx', `${(x * lift).toFixed(1)}px`);
		el.style.setProperty('--ty', `${(y * lift).toFixed(1)}px`);
	};
	const rest = () => {
		for (const name of ['--rx', '--ry', '--tx', '--ty']) ref.current?.style.removeProperty(name);
	};
	return (
		<div className={cn('tilt', className)} onPointerLeave={rest} onPointerMove={move} ref={ref}>
			<div className="tilt__inner">{children}</div>
		</div>
	);
}
