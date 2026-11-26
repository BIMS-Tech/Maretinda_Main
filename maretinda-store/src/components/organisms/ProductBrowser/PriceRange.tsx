'use client';

import { useEffect, useId, useState } from 'react';

import { peso } from '@/components/motion';
import { cn } from '@/lib/utils';
import type { SearchResponse } from '@/types/search';

const STEPS = 200;

/** Whole numbers people think in: ₱1,240 becomes ₱1,250. */
const tidy = (n: number) => {
	const step = n < 100 ? 5 : n < 500 ? 10 : n < 2000 ? 50 : n < 10_000 ? 100 : n < 50_000 ? 500 : 1000;
	return Math.round(n / step) * step;
};

/**
 * The price filter: where prices lie, and two handles. The handles move along
 * the same bend as the bars, so the cheap end isn't squeezed by one costly item.
 */
export function PriceRange({
	price,
	min,
	max,
	onChange,
	labels,
}: {
	price: NonNullable<SearchResponse['price']>;
	min: number | null;
	max: number | null;
	onChange: (min: number | null, max: number | null) => void;
	labels: { min: string; max: string; apply: string };
}) {
	const { min: low, max: high, scale, histogram } = price;
	const id = useId();
	const span = Math.max(high - low, 1);
	const toStep = (amount: number) => Math.round(Math.min(1, Math.max(0, (amount - low) / span)) ** (1 / scale) * STEPS);
	const toAmount = (step: number) => {
		if (step <= 0) return low;
		if (step >= STEPS) return high;
		return Math.min(high, Math.max(low, tidy(low + (step / STEPS) ** scale * span)));
	};

	const [from, setFrom] = useState(min ?? low);
	const [to, setTo] = useState(max ?? high);
	useEffect(() => setFrom(min ?? low), [min, low]);
	useEffect(() => setTo(max ?? high), [max, high]);

	const commit = (a = from, b = to) => {
		const [x, y] = a <= b ? [a, b] : [b, a];
		const nextMin = x <= low ? null : x;
		const nextMax = y >= high ? null : y;
		if (nextMin !== min || nextMax !== max) onChange(nextMin, nextMax);
	};

	const a = toStep(Math.min(from, to));
	const b = toStep(Math.max(from, to));
	const tallest = Math.max(1, ...histogram);

	const handle = (which: 'from' | 'to') => ({
		'aria-label': which === 'from' ? labels.min : labels.max,
		'aria-valuetext': peso(which === 'from' ? from : to),
		className: 'price-handle',
		max: STEPS,
		min: 0,
		onBlur: () => commit(),
		onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
			const amount = toAmount(Number(e.target.value));
			if (which === 'from') setFrom(Math.min(amount, to));
			else setTo(Math.max(amount, from));
		},
		onKeyUp: () => commit(),
		onPointerUp: () => commit(),
		type: 'range' as const,
		value: which === 'from' ? toStep(from) : toStep(to),
	});

	const box = (which: 'from' | 'to') => (
		<label className="flex h-10 flex-1 items-center gap-1 rounded-xl border border-[#E7E1EE] bg-white px-3 focus-within:border-[#432C63]" htmlFor={`${id}-${which}`}>
			<span className="text-[12px] text-[#A39DAC]">₱</span>
			<input
				aria-label={which === 'from' ? labels.min : labels.max}
				className="w-full min-w-0 bg-transparent text-[13px] font-semibold tabular-nums outline-none"
				id={`${id}-${which}`}
				inputMode="numeric"
				onBlur={() => commit()}
				onChange={(e) => {
					const n = Number(e.target.value.replace(/\D/g, '').slice(0, 9) || 0);
					if (which === 'from') setFrom(n);
					else setTo(n);
				}}
				onKeyDown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						commit();
					}
				}}
				value={Math.round(which === 'from' ? from : to).toLocaleString('en-PH')}
			/>
		</label>
	);

	return (
		<div data-testid="price-filter">
			<div aria-hidden="true" className="flex h-14 items-end gap-[2px] px-2">
				{histogram.map((n, i) => {
					const at = ((i + 0.5) / histogram.length) * STEPS;
					const inside = at >= a && at <= b;
					return (
						<span
							className={cn('flex-1 rounded-t-[3px] transition-[background-color,height] duration-500 ease-soft', inside ? 'bg-[#432C63]' : 'bg-[#E7E1EE]')}
							// biome-ignore lint/suspicious/noArrayIndexKey: fixed bars
							key={i}
							style={{ height: n ? `${Math.max(10, (n / tallest) ** 0.6 * 100)}%` : '3px' }}
						/>
					);
				})}
			</div>
			<div className="relative -mt-px h-6">
				<div className="absolute inset-x-2 top-[3px] h-[3px] rounded-full bg-[#E7E1EE]" />
				<div
					className="absolute top-[3px] h-[3px] rounded-full bg-[#432C63]"
					style={{ left: `calc(8px + (100% - 16px) * ${a / STEPS})`, right: `calc(8px + (100% - 16px) * ${1 - b / STEPS})` }}
				/>
				<input {...handle('from')} style={{ zIndex: a > STEPS * 0.9 ? 3 : 2 }} />
				<input {...handle('to')} style={{ zIndex: 2 }} />
			</div>
			<div className="mt-2 flex items-center gap-2">
				{box('from')}
				<span aria-hidden="true" className="text-[#C9C2D3]">–</span>
				{box('to')}
			</div>
		</div>
	);
}
