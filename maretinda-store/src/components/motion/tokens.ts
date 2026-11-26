/**
 * The store's motion, in one place. Things arrive quickly and settle softly;
 * things you touch answer on a spring. CSS uses the same curves (app/motion.css).
 */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

/** Pills, rings and anything that slides to where you pointed. */
export const SPRING = { damping: 34, mass: 0.8, stiffness: 420, type: 'spring' } as const;
/** Larger surfaces: drawers, cards finding their place. */
export const SPRING_SOFT = { damping: 34, mass: 0.9, stiffness: 300, type: 'spring' } as const;

export const DURATION = { base: 0.32, fast: 0.18, slow: 0.6 } as const;

export const prefersReducedMotion = () =>
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
