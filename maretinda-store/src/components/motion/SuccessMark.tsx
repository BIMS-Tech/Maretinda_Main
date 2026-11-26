import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';

const DOTS = 14;
const COLORS = ['#FFC533', '#432C63', '#1F7A4D', '#B79AE0'];

/** A tick that draws itself, with a small burst. Plays once, on appearing. */
export const SuccessMark = ({ size = 72, className, burst = true }: { size?: number; className?: string; burst?: boolean }) => (
	<span aria-hidden="true" className={cn('success-mark', className)} style={{ height: size, width: size }}>
		{burst &&
			Array.from({ length: DOTS }, (_, i) => (
				<i
					// biome-ignore lint/suspicious/noArrayIndexKey: identical dots around a circle
					key={i}
					style={
						{
							'--angle': `${(360 / DOTS) * i}deg`,
							'--reach': `${size * (i % 2 ? 0.78 : 1)}px`,
							background: COLORS[i % COLORS.length],
						} as CSSProperties
					}
				/>
			))}
		<svg fill="none" viewBox="0 0 52 52">
			<circle className="success-mark__disc" cx="26" cy="26" fill="#1F7A4D" r="26" />
			<path className="success-mark__tick" d="M15 27.2l7.4 7.3L37.5 19" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
		</svg>
	</span>
);
