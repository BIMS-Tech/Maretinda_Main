'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import type { ReactNode } from 'react';

import { EASE_OUT } from '@/components/motion';

export const Dropdown = ({ children, className = '', show }: { children: ReactNode; className?: string; show: boolean }) => (
	<AnimatePresence>
		{show && (
			<m.div
				animate={{ opacity: 1, scale: 1, y: 0 }}
				className={`absolute -right-2 z-20 w-max origin-top-right rounded-sm bg-primary text-primary shadow-[0px_4px_10px_2px_rgba(0,0,0,0.18)] ${className}`}
				exit={{ opacity: 0, scale: 0.97, y: -4 }}
				initial={{ opacity: 0, scale: 0.95, y: -8 }}
				transition={{ duration: 0.22, ease: EASE_OUT }}
			>
				{children}
			</m.div>
		)}
	</AnimatePresence>
);
