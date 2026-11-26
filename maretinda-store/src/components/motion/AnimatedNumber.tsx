'use client';

import { animate } from 'motion/react';
import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

import { EASE_OUT, prefersReducedMotion } from './tokens';

/**
 * A number that counts to its new value. The server sends the final value, so
 * it is right before (and without) the animation. `fromZero` counts up the
 * first time it scrolls into view.
 */
export function AnimatedNumber({
	value,
	format = (n) => Math.round(n).toLocaleString('en-PH'),
	className,
	fromZero = false,
	duration = 0.7,
}: {
	value: number;
	format?: (n: number) => string;
	className?: string;
	fromZero?: boolean;
	duration?: number;
}) {
	const ref = useRef<HTMLSpanElement>(null);
	const shown = useRef(value);
	const formatRef = useRef(format);
	formatRef.current = format;

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const from = shown.current;
		if (from === value) {
			el.textContent = formatRef.current(value);
			return;
		}
		if (prefersReducedMotion()) {
			shown.current = value;
			el.textContent = formatRef.current(value);
			return;
		}
		const controls = animate(from, value, {
			duration,
			ease: EASE_OUT,
			onUpdate: (n) => {
				shown.current = n;
				el.textContent = formatRef.current(n);
			},
			onComplete: () => {
				shown.current = value;
				el.textContent = formatRef.current(value);
			},
		});
		return () => controls.stop();
	}, [value, duration]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: only the first time it is seen
	useEffect(() => {
		const el = ref.current;
		if (!fromZero || !el || prefersReducedMotion()) return;
		let controls: ReturnType<typeof animate> | undefined;
		const seen = new IntersectionObserver(([entry]) => {
			if (!entry.isIntersecting) return;
			seen.disconnect();
			controls = animate(0, value, {
				duration: 1.4,
				ease: EASE_OUT,
				onUpdate: (n) => {
					el.textContent = formatRef.current(n);
				},
				onComplete: () => {
					el.textContent = formatRef.current(value);
				},
			});
		});
		seen.observe(el);
		return () => {
			seen.disconnect();
			controls?.stop();
		};
	}, [fromZero]);

	return (
		<span className={cn('tabular-nums', className)} ref={ref} suppressHydrationWarning>
			{format(value)}
		</span>
	);
}

const PESO = new Intl.NumberFormat('en-PH', { currency: 'PHP', maximumFractionDigits: 0, style: 'currency' });
const PESO_CENTS = new Intl.NumberFormat('en-PH', { currency: 'PHP', style: 'currency' });

/** ₱1,250, or ₱1,250.50 when there are centavos. */
export const peso = (n: number) => (Number.isInteger(Math.round(n * 100) / 100) ? PESO.format(n) : PESO_CENTS.format(n));

/** A price that counts to its new value; whole pesos while it moves. */
export const AnimatedPeso = ({ value, className, fromZero }: { value: number; className?: string; fromZero?: boolean }) => (
	<AnimatedNumber
		className={className}
		format={(n) => (Math.abs(n - value) < 0.005 ? peso(value) : PESO.format(Math.round(n)))}
		fromZero={fromZero}
		value={value}
	/>
);
