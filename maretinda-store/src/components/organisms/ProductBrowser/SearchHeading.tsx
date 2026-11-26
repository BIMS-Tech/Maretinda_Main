'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { useSearchParams } from 'next/navigation';

import { EASE_OUT } from '@/components/motion';
import { readListing } from '@/lib/listing';
import { useLanguage } from '@/providers/LanguageProvider';

export function SearchHeading() {
	const { t } = useLanguage();
	const { q } = readListing(new URLSearchParams(useSearchParams().toString()));
	return (
		<div className="mb-7">
			<p className="text-[11.5px] font-bold uppercase tracking-[0.18em] text-[#432C63]/60">{q ? t.listing.resultsFor : t.listing.search}</p>
			<h1 className="mt-1 overflow-hidden font-serif text-[34px] leading-[1.15] tracking-[-0.01em] text-[#1B1B1B] lg:text-[44px]">
				<AnimatePresence initial={false} mode="popLayout">
					<m.span animate={{ y: 0 }} className="inline-block max-w-full break-words" exit={{ y: '-110%' }} initial={{ y: '110%' }} key={q} transition={{ duration: 0.55, ease: EASE_OUT }}>
						{q ? `“${q}”` : t.listing.browseAll}
					</m.span>
				</AnimatePresence>
			</h1>
		</div>
	);
}
