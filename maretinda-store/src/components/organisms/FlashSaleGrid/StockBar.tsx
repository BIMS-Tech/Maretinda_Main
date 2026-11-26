'use client';

import * as m from 'motion/react-m';

import { EASE_OUT } from '@/components/motion';

/** How much of a deal is gone; fills as it scrolls into view. */
export const StockBar = ({ sold, limit }: { sold: number; limit: number }) => {
	const share = Math.min(1, Math.max(0, sold / limit));
	const left = Math.max(0, limit - sold);
	return (
		<div className="mt-2.5 px-1">
			<div className="h-1.5 overflow-hidden rounded-full bg-[#FFC533]/20">
				<m.div
					className={`h-full origin-left rounded-full ${share > 0.8 ? 'bg-[#D94040]' : 'bg-[#FFC533]'}`}
					initial={{ scaleX: 0 }}
					transition={{ delay: 0.2, duration: 1, ease: EASE_OUT }}
					viewport={{ once: true }}
					whileInView={{ scaleX: share }}
				/>
			</div>
			<p className="mt-1 text-[11px] font-medium text-[#737373]">{left ? `${left} left of ${limit}` : 'All claimed'}</p>
		</div>
	);
};
