'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';

import { peso, SPRING } from '@/components/motion';
import { clearFilters, type ListingState, toggleFilter } from '@/lib/listing';
import { useLanguage } from '@/providers/LanguageProvider';
import type { SearchResponse } from '@/types/search';

/** The filters that are on, each one tap from off. */
export function ActiveFilters({
	state,
	results,
	onChange,
	hide = [],
	showQuery = false,
}: {
	state: ListingState;
	results: SearchResponse;
	onChange: (next: ListingState) => void;
	hide?: string[];
	/** Where nothing else on the page says what was searched for */
	showQuery?: boolean;
}) {
	const { t } = useLanguage();
	const s = t.listing;

	const chips: { key: string; label: string; off: ListingState }[] = [];
	if (showQuery && state.q) chips.push({ key: 'q', label: `“${state.q}”`, off: { ...state, q: '' } });
	for (const [name, values] of Object.entries(state.filters)) {
		if (hide.includes(name)) continue;
		const facet = results.facets.find((f) => f.name === name);
		// Something in the address that isn't a filter here
		if (!facet) continue;
		for (const value of values) {
			const known = facet.values.find((v) => [v.value.toLowerCase(), v.label.toLowerCase()].includes(value.toLowerCase()));
			chips.push({ key: `${name}:${value}`, label: known?.label ?? value, off: toggleFilter(state, name, value) });
		}
	}
	if (state.min_price != null || state.max_price != null) {
		const { min_price: a, max_price: b } = state;
		chips.push({
			key: 'price',
			label: a != null && b != null ? `${peso(a)} – ${peso(b)}` : a != null ? s.priceFrom(peso(a)) : s.priceTo(peso(b as number)),
			off: { ...state, max_price: null, min_price: null },
		});
	}
	if (state.rating) chips.push({ key: 'rating', label: `${state.rating}★ ${s.andUp}`, off: { ...state, rating: null } });
	if (state.on_sale) chips.push({ key: 'on_sale', label: s.onSale, off: { ...state, on_sale: false } });
	if (state.in_stock) chips.push({ key: 'in_stock', label: s.inStock, off: { ...state, in_stock: false } });
	if (state.verified) chips.push({ key: 'verified', label: s.verifiedShops, off: { ...state, verified: false } });

	return (
		<div
			className="grid transition-[grid-template-rows] duration-400 ease-soft"
			style={{ gridTemplateRows: chips.length ? '1fr' : '0fr' }}
		>
			<div className="min-h-0 overflow-hidden">
				<ul className="flex flex-wrap items-center gap-2 pb-5" data-testid="active-filters">
					<AnimatePresence initial={false} mode="popLayout">
						{chips.map((chip) => (
							<m.li animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }} initial={{ opacity: 0, scale: 0.7 }} key={chip.key} layout transition={SPRING}>
								<button
									aria-label={`${s.remove} ${chip.label}`}
									className="group flex h-8 items-center gap-1.5 rounded-full bg-[#F1EDF6] pl-3.5 pr-2.5 text-[12.5px] font-semibold text-[#432C63] transition-colors hover:bg-[#E6DEF0]"
									onClick={() => onChange(chip.off)}
									type="button"
								>
									{chip.label}
									<svg aria-hidden="true" className="transition-transform duration-300 group-hover:rotate-90" fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeWidth="2.8" viewBox="0 0 24 24" width="12">
										<path d="M6 6l12 12M18 6L6 18" />
									</svg>
								</button>
							</m.li>
						))}
						{chips.length > 1 && (
							<m.li animate={{ opacity: 1 }} exit={{ opacity: 0 }} initial={{ opacity: 0 }} key="all" layout transition={SPRING}>
								<button className="h-8 px-2 text-[12.5px] font-semibold text-[#737373] underline-offset-2 hover:text-[#1B1B1B] hover:underline" onClick={() => onChange(clearFilters(state))} type="button">
									{s.clearAll}
								</button>
							</m.li>
						)}
					</AnimatePresence>
				</ul>
			</div>
		</div>
	);
}
