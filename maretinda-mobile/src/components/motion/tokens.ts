import { Easing } from 'react-native-reanimated';

/**
 * The same movement as the storefront: things arrive quickly and settle softly.
 * Reanimated leaves animations out for people who ask their phone for less of them.
 */
export const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
export const SPRING = { damping: 26, mass: 0.8, stiffness: 320 };
export const SPRING_SOFT = { damping: 22, mass: 1, stiffness: 190 };

/** How long after the first the nth of a group arrives. */
export const stagger = (index: number, step = 55, max = 8) => Math.min(index, max) * step;
