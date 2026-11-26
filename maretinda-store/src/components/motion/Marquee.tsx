import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** A line of words drifting past. Stops for a pointer, and for people who want less motion. */
export const Marquee = ({ items, className }: { items: ReactNode[]; className?: string }) => (
	<div className={cn('marquee', className)}>
		{[0, 1].map((copy) => (
			<div aria-hidden={copy === 1 || undefined} className="marquee__track" key={copy}>
				{items.map((item, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: a fixed list
					<span className="marquee__item" key={i}>
						{item}
						<span aria-hidden="true" className="marquee__dot" />
					</span>
				))}
			</div>
		))}
	</div>
);
