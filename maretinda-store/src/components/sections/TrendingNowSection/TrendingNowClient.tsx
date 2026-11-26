'use client';

import type { HttpTypes } from '@medusajs/types';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { type ReactNode, useRef, useState } from 'react';

import { EASE_OUT, Segmented, SPRING_SOFT } from '@/components/motion';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { ProductCard } from '@/components/organisms/ProductCard/ProductCard';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/providers/LanguageProvider';
import type { ProductCardData, SearchResponse } from '@/types/search';
import type { Wishlist } from '@/types/wishlist';

const ALL = 'all';
const SHOWN = 10;

/** What is popular, by category: the cards that stay slide to their new places. */
export function TrendingNowClient({
	heading,
	initial,
	filters,
	limit,
	user,
	wishlist,
}: {
	heading: ReactNode;
	initial: ProductCardData[];
	filters: { label: string; handle: string; id: string }[];
	limit: number;
	user: HttpTypes.StoreCustomer | null;
	wishlist: Wishlist[];
}) {
	const { t } = useLanguage();
	const [picked, setPicked] = useState(ALL);
	const [products, setProducts] = useState(initial);
	const [loading, setLoading] = useState(false);
	const loaded = useRef(new Map<string, ProductCardData[]>([[ALL, initial]]));
	const latest = useRef(ALL);

	const pick = async (handle: string) => {
		setPicked(handle);
		latest.current = handle;
		const before = loaded.current.get(handle);
		if (before) {
			setProducts(before);
			setLoading(false);
			return;
		}
		setLoading(true);
		try {
			const id = filters.find((f) => f.handle === handle)?.id ?? '';
			const res = await fetch(`/api/search?${new URLSearchParams({ category_id: id, in_stock: '1', limit: String(limit), sort: 'popular' })}`);
			if (!res.ok) throw new Error(String(res.status));
			const { products: found } = (await res.json()) as SearchResponse;
			loaded.current.set(handle, found);
			// They may have picked another one meanwhile
			if (latest.current === handle) setProducts(found);
		} catch (error) {
			console.error('[trending]', error);
		} finally {
			if (latest.current === handle) setLoading(false);
		}
	};

	const category = filters.find((f) => f.handle === picked);

	return (
		<>
			<div className="mb-8 flex flex-wrap items-end justify-between gap-5">
				{heading}
				{filters.length > 1 && (
					<Segmented
						label="Category"
						onChange={pick}
						options={[{ label: t.searchBox.all, value: ALL }, ...filters.map((f) => ({ label: f.label, value: f.handle }))]}
						value={picked}
					/>
				)}
			</div>

			{products.length ? (
				<ul className={cn('relative grid grid-cols-2 gap-x-3 gap-y-8 transition-opacity duration-300 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-5', loading && 'opacity-60')}>
					<AnimatePresence initial={false} mode="popLayout">
						{products.slice(0, SHOWN).map((product, i) => (
							<m.li
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.22, ease: EASE_OUT } }}
								initial={{ opacity: 0, scale: 0.9 }}
								key={product.id}
								layout="position"
								transition={{ ...SPRING_SOFT, delay: i * 0.02, layout: SPRING_SOFT }}
							>
								<ProductCard product={product} user={user} wishlist={wishlist} />
							</m.li>
						))}
					</AnimatePresence>
				</ul>
			) : (
				<div className="rise-in rounded-[22px] border border-[#EDEAE3] bg-white px-6 py-14 text-center">
					<p className="text-[15px] font-semibold text-[#1B1B1B]">Nothing trending here yet</p>
					<p className="mt-1.5 text-[13px] text-[#737373]">There are no trending products in this category right now. Try another category.</p>
				</div>
			)}

			<div className="mt-10 flex justify-center">
				<LocalizedClientLink
					className="press inline-flex h-12 items-center gap-2 rounded-full bg-[#432C63] px-7 text-[13.5px] font-bold text-white"
					href={category ? `/categories/${category.handle}` : '/search?sort=popular'}
				>
					{t.home.viewAll}
					{category && ` ${category.label}`}
					<svg aria-hidden="true" className="arrow" fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 24 24" width="14">
						<path d="M5 12h14M13 5l7 7-7 7" />
					</svg>
				</LocalizedClientLink>
			</div>
		</>
	);
}
