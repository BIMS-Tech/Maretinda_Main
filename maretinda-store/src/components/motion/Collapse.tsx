'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { type ReactNode, useState } from 'react';

import { EASE_OUT } from './tokens';

/**
 * Opens and closes by height. Clips only while it moves: menus inside must be
 * able to hang out of it once it is open.
 */
export function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
	const [moving, setMoving] = useState(false);
	return (
		<AnimatePresence initial={false}>
			{open && (
				<m.div
					animate={{ height: 'auto', opacity: 1 }}
					exit={{ height: 0, opacity: 0 }}
					initial={{ height: 0, opacity: 0 }}
					onAnimationComplete={() => setMoving(false)}
					onAnimationStart={() => setMoving(true)}
					style={{ overflow: moving ? 'hidden' : 'visible' }}
					transition={{ duration: 0.42, ease: EASE_OUT }}
				>
					{children}
				</m.div>
			)}
		</AnimatePresence>
	);
}
