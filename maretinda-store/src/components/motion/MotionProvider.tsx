'use client';

import { LazyMotion, MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

import { EASE_OUT } from './tokens';

const features = () => import('./features').then((m) => m.default);

/** Motion for everything below, switched off for people who ask their device for less of it. */
export const MotionProvider = ({ children }: { children: ReactNode }) => (
	<LazyMotion features={features} strict>
		<MotionConfig reducedMotion="user" transition={{ duration: 0.4, ease: EASE_OUT }}>
			{children}
		</MotionConfig>
	</LazyMotion>
);
