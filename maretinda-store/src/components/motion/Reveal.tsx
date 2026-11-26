'use client';

import { type CSSProperties, createElement, type ElementType, type ReactNode, useEffect, useLayoutEffect, useRef } from 'react';

import { prefersReducedMotion } from './tokens';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

type Watched = { el: Element; show: () => void };
let observer: IntersectionObserver | null = null;
const watched = new Map<Element, Watched['show']>();

/** One observer for the whole page. */
function watch(el: Element, show: () => void) {
	observer ??= new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				watched.get(entry.target)?.();
				unwatch(entry.target);
			}
		},
		{ rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
	);
	watched.set(el, show);
	observer.observe(el);
}

function unwatch(el: Element) {
	watched.delete(el);
	observer?.unobserve(el);
}

type RevealProps = {
	as?: ElementType;
	children: ReactNode;
	className?: string;
	/** Milliseconds */
	delay?: number;
	/** up: rises in. group: its children rise in one after another. mask: words of a MaskedText rise. */
	variant?: 'up' | 'fade' | 'scale' | 'group' | 'mask';
	style?: CSSProperties;
	[x: string]: unknown;
};

/**
 * Brings content in as it scrolls into view.
 *
 * The server sends it visible, and whatever is already on screen when the page
 * loads is left alone, so nothing waits on JavaScript to be readable. Only
 * content further down is tucked away first. Once it has arrived the attribute
 * goes, so it can't interfere with hover transitions of its own.
 */
export function Reveal({ as = 'div', children, className, delay = 0, variant = 'up', style, ...rest }: RevealProps) {
	const ref = useRef<HTMLElement>(null);

	useIsomorphicLayoutEffect(() => {
		const el = ref.current;
		if (!el || prefersReducedMotion() || !('IntersectionObserver' in window)) return;
		// Already on screen: leave it be
		if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

		let timer: ReturnType<typeof setTimeout>;
		el.dataset.reveal = 'hidden';
		watch(el, () => {
			el.dataset.reveal = 'shown';
			timer = setTimeout(() => {
				delete el.dataset.reveal;
			}, 1800 + delay);
		});
		return () => {
			clearTimeout(timer);
			unwatch(el);
			delete el.dataset.reveal;
		};
	}, [delay]);

	return createElement(
		as,
		{
			...rest,
			className,
			'data-reveal-kind': variant,
			ref,
			style: { ...style, ...(delay ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties) : {}) },
		},
		children,
	);
}
