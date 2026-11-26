'use client';

import * as m from 'motion/react-m';
import { useMemo, useState } from 'react';

import { SPRING } from '@/components/motion';
import { clearFilter, type ListingState, toggleFilter } from '@/lib/listing';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/providers/LanguageProvider';
import type { Facet, SearchResponse } from '@/types/search';

import { FilterSection, Switch, Tick } from './FilterSection';
import { PriceRange } from './PriceRange';

const SWATCHES: Record<string, string> = {
	beige: '#EADFCB', black: '#1A1A1A', blue: '#3B82F6', brown: '#8B5A2B', cream: '#FBF3DC', gold: '#D4A017', gray: '#8A8F98', grey: '#8A8F98',
	green: '#2FA36B', ivory: '#FBF8EC', khaki: '#B8A97E', lavender: '#B79AE0', maroon: '#7A1F2B', mint: '#A8E0C8', multicolor: 'conic-gradient(#EF4444,#EAB308,#22C55E,#3B82F6,#A855F7,#EF4444)',
	navy: '#1E3A5F', olive: '#6B7A3A', orange: '#F97316', peach: '#F9C9A9', pink: '#EC6FA0', purple: '#8B5CF6', red: '#DC3D3D', rose: '#E8A0A8', silver: '#C0C4CC', tan: '#D2B48C',
	teal: '#1F9E94', turquoise: '#40CFC4', violet: '#7C3AED', white: '#FFFFFF', yellow: '#F5C518',
};
const LIGHT = new Set(['beige', 'cream', 'gold', 'ivory', 'lavender', 'mint', 'peach', 'silver', 'tan', 'white', 'yellow', 'khaki', 'rose']);

const selectedIn = (state: ListingState, facet: Facet, value: { value: string; label: string }) =>
	(state.filters[facet.name] ?? []).some((v) => [value.value.toLowerCase(), value.label.toLowerCase()].includes(v.toLowerCase()));

/** Turning a value off must use the spelling the address has. */
const addressed = (state: ListingState, facet: Facet, value: { value: string; label: string }) =>
	(state.filters[facet.name] ?? []).find((v) => v.toLowerCase() === value.label.toLowerCase()) ?? value.value;

type Props = { results: SearchResponse; state: ListingState; onChange: (next: ListingState) => void; hide?: string[] };

export function Filters({ results, state, onChange, hide = [] }: Props) {
	const { t } = useLanguage();
	const s = t.listing;
	const facets = results.facets.filter((f) => !hide.includes(f.name));
	const toggle = (facet: Facet, value: Facet['values'][number]) => onChange(toggleFilter(state, facet.name, addressed(state, facet, value)));

	const switches: { key: 'on_sale' | 'in_stock' | 'verified'; label: string; count: number }[] = [
		{ count: results.on_sale_count, key: 'on_sale', label: s.onSale },
		{ count: results.in_stock_count, key: 'in_stock', label: s.inStock },
		{ count: results.verified_count, key: 'verified', label: s.verifiedShops },
	];
	const shown = switches.filter((x) => x.count > 0 || state[x.key]);
	const ratings = ['4', '3', '2'].filter((r) => (results.rating_counts[r] ?? 0) > 0 || state.rating === Number(r));
	const priceOn = state.min_price != null || state.max_price != null;

	const first = facets.filter((f) => ['category', 'type', 'brand'].includes(f.name));
	const rest = facets.filter((f) => !first.includes(f));
	const section = (facet: Facet) => {
		const active = facet.values.filter((v) => selectedIn(state, facet, v)).length;
		const title = s.facets[facet.name as keyof typeof s.facets] ?? facet.label;
		const body =
			facet.name === 'color' ? (
				<Swatches facet={facet} onPick={(v) => toggle(facet, v)} state={state} />
			) : facet.name === 'size' || (facet.values.length <= 8 && facet.values.every((v) => v.label.length <= 12) && !['category', 'brand', 'store'].includes(facet.name)) ? (
				<Pills facet={facet} onPick={(v) => toggle(facet, v)} state={state} />
			) : (
				<Checks facet={facet} onPick={(v) => toggle(facet, v)} state={state} />
			);
		return (
			<FilterSection active={active} clearLabel={s.clear} key={facet.name} onClear={() => onChange(clearFilter(state, facet.name))} title={title}>
				{body}
			</FilterSection>
		);
	};

	return (
		<div data-testid="filters">
			{shown.length > 0 && (
				<section className="space-y-1 border-b border-[#F0ECF4] pb-4">
					{shown.map((x) => (
						<button
							aria-checked={state[x.key]}
							className="flex w-full items-center justify-between gap-3 rounded-xl py-1.5 text-left"
							key={x.key}
							onClick={() => onChange({ ...state, [x.key]: !state[x.key] })}
							role="switch"
							type="button"
						>
							<span className="text-[13px] font-medium text-[#404040]">
								{x.label} <span className="text-[12px] text-[#A39DAC]">({x.count})</span>
							</span>
							<Switch on={state[x.key]} />
						</button>
					))}
				</section>
			)}
			{first.map(section)}
			{results.price && (results.price.max > results.price.min || priceOn) && (
				<FilterSection
					active={priceOn ? 1 : 0}
					clearLabel={s.clear}
					onClear={() => onChange({ ...state, max_price: null, min_price: null })}
					title={s.price}
				>
					<PriceRange
						labels={{ apply: s.apply, max: s.maxPrice, min: s.minPrice }}
						max={state.max_price}
						min={state.min_price}
						onChange={(min_price, max_price) => onChange({ ...state, max_price, min_price })}
						price={results.price}
					/>
				</FilterSection>
			)}
			{ratings.length > 0 && (
				<FilterSection active={state.rating ? 1 : 0} clearLabel={s.clear} onClear={() => onChange({ ...state, rating: null })} title={s.rating}>
					<div className="space-y-1">
						{ratings.map((r) => {
							const on = state.rating === Number(r);
							return (
								<button
									aria-pressed={on}
									className={cn('relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-colors', on ? 'text-[#432C63]' : 'text-[#404040] hover:bg-[#F8F5FB]')}
									key={r}
									onClick={() => onChange({ ...state, rating: on ? null : Number(r) })}
									type="button"
								>
									{on && <m.span className="absolute inset-0 rounded-xl border-2 border-[#432C63] bg-[#F6F2FB]" layoutId="rating-choice" transition={SPRING} />}
									<span aria-hidden="true" className="relative tracking-[1px] text-[#F0B400]">
										{'★'.repeat(Number(r))}
										<span className="text-[#E3DDEA]">{'★'.repeat(5 - Number(r))}</span>
									</span>
									<span className="relative font-medium">{s.andUp}</span>
									<span className="sr-only">{r}</span>
									<span className="relative ml-auto text-[12px] text-[#A39DAC]">{results.rating_counts[r]}</span>
								</button>
							);
						})}
					</div>
				</FilterSection>
			)}
			{rest.map(section)}
		</div>
	);
}

type ListProps = { facet: Facet; state: ListingState; onPick: (value: Facet['values'][number]) => void };
const FEW = 7;

function Checks({ facet, state, onPick }: ListProps) {
	const { t } = useLanguage();
	const s = t.listing;
	const [all, setAll] = useState(false);
	const [find, setFind] = useState('');
	const searchable = facet.values.length > 10;
	const values = useMemo(() => {
		const wanted = find.trim().toLowerCase();
		return wanted ? facet.values.filter((v) => v.label.toLowerCase().includes(wanted)) : facet.values;
	}, [facet.values, find]);
	const picked = (v: Facet['values'][number]) => selectedIn(state, facet, v);
	const shown = all || find ? values : values.filter((v, i) => i < FEW || picked(v));

	return (
		<>
			{searchable && (
				<input
					aria-label={`${s.find} ${facet.label}`}
					className="mb-3 h-9 w-full rounded-xl border border-[#E7E1EE] bg-[#FBFAFC] px-3 text-[13px] outline-none transition-colors focus:border-[#432C63] focus:bg-white"
					onChange={(e) => setFind(e.target.value)}
					placeholder={`${s.find}…`}
					value={find}
				/>
			)}
			<ul className={cn('space-y-0.5', all && 'max-h-72 overflow-y-auto pr-1')}>
				{shown.map((v) => {
					const on = picked(v);
					return (
						<li key={v.value}>
							<button
								aria-checked={on}
								className={cn('group flex w-full items-center gap-2.5 rounded-lg py-1.5 text-left text-[13px] transition-opacity', !v.count && !on && 'opacity-40')}
								disabled={!v.count && !on}
								onClick={() => onPick(v)}
								role="checkbox"
								type="button"
							>
								<Tick on={on} />
								<span className={cn('min-w-0 flex-1 truncate transition-colors', on ? 'font-semibold text-[#432C63]' : 'text-[#404040] group-hover:text-[#1B1B1B]')}>{v.label}</span>
								<span className="text-[12px] tabular-nums text-[#A39DAC]">{v.count}</span>
							</button>
						</li>
					);
				})}
				{!shown.length && <li className="py-1.5 text-[12.5px] text-[#A39DAC]">{s.noMatches}</li>}
			</ul>
			{!find && values.length > FEW && (
				<button className="mt-2 text-[12.5px] font-semibold text-[#432C63] hover:underline" onClick={() => setAll((x) => !x)} type="button">
					{all ? s.showLess : `${s.showAll} (${values.length})`}
				</button>
			)}
		</>
	);
}

function Pills({ facet, state, onPick }: ListProps) {
	return (
		<div className="flex flex-wrap gap-2">
			{facet.values.map((v) => {
				const on = selectedIn(state, facet, v);
				return (
					<button
						aria-pressed={on}
						className={cn(
							'press rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold',
							on ? 'border-[#432C63] bg-[#432C63] text-white' : 'border-[#E7E1EE] bg-white text-[#404040] hover:border-[#432C63]',
							!v.count && !on && 'cursor-not-allowed opacity-40',
						)}
						disabled={!v.count && !on}
						key={v.value}
						onClick={() => onPick(v)}
						type="button"
					>
						{v.label}
						<span className={cn('ml-1.5 text-[11px] font-medium', on ? 'text-white/70' : 'text-[#A39DAC]')}>{v.count}</span>
					</button>
				);
			})}
		</div>
	);
}

function Swatches({ facet, state, onPick }: ListProps) {
	return (
		<div className="flex flex-wrap gap-x-3 gap-y-3.5">
			{facet.values.map((v) => {
				const on = selectedIn(state, facet, v);
				const name = v.label.toLowerCase();
				const fill = SWATCHES[name];
				return (
					<button
						aria-label={`${v.label} (${v.count})`}
						aria-pressed={on}
						className={cn('group flex w-11 flex-col items-center gap-1.5', !v.count && !on && 'cursor-not-allowed opacity-35')}
						disabled={!v.count && !on}
						key={v.value}
						onClick={() => onPick(v)}
						title={v.label}
						type="button"
					>
						<span
							className={cn(
								'flex h-8 w-8 items-center justify-center rounded-full ring-offset-2 transition-[box-shadow,transform] duration-300 ease-spring',
								on ? 'scale-105 ring-2 ring-[#432C63]' : 'ring-0 group-hover:scale-110',
								(!fill || LIGHT.has(name)) && 'border border-[#DDD7E5]',
							)}
							style={{ background: fill ?? '#F6F2FB' }}
						>
							{fill ? (
								<svg aria-hidden="true" fill="none" height="13" stroke={LIGHT.has(name) ? '#1B1B1B' : '#fff'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.4" viewBox="0 0 24 24" width="13">
									<path d="M5 13l4 4L19 7" style={{ strokeDasharray: 24, strokeDashoffset: on ? 0 : 24, transition: 'stroke-dashoffset .28s cubic-bezier(.16,1,.3,1)' }} />
								</svg>
							) : (
								<span className="text-[11px] font-bold text-[#432C63]">{v.label.slice(0, 2)}</span>
							)}
						</span>
						<span className={cn('w-full truncate text-center text-[10.5px] leading-none', on ? 'font-bold text-[#432C63]' : 'text-[#737373]')}>{v.label}</span>
					</button>
				);
			})}
		</div>
	);
}
