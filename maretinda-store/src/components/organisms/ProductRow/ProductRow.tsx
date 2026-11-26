'use client';

import type { HttpTypes } from '@medusajs/types';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import type { ProductCardData } from '@/types/search';
import type { Wishlist } from '@/types/wishlist';

import { ProductCard } from '../ProductCard/ProductCard';

/** A row of cards to swipe or step through. */
export function ProductRow({ products, user, wishlist, label }: { products: ProductCardData[]; user: HttpTypes.StoreCustomer | null; wishlist: Wishlist[]; label: string }) {
	const row = useRef<HTMLUListElement>(null);
	const [at, setAt] = useState({ end: true, start: true });

	useEffect(() => {
		const el = row.current;
		if (!el) return;
		const measure = () => setAt({ end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8, start: el.scrollLeft <= 8 });
		measure();
		el.addEventListener('scroll', measure, { passive: true });
		const size = new ResizeObserver(measure);
		size.observe(el);
		return () => {
			el.removeEventListener('scroll', measure);
			size.disconnect();
		};
	}, []);

	const step = (direction: 1 | -1) => row.current?.scrollBy({ behavior: 'smooth', left: direction * row.current.clientWidth * 0.8 });
	const arrow = (direction: 1 | -1, off: boolean) => (
		<button
			aria-label={direction === 1 ? `More ${label}` : `Back through ${label}`}
			className={cn(
				'press absolute top-[calc(50%-58px)] z-10 hidden h-11 w-11 items-center justify-center rounded-full bg-white text-[#432C63] shadow-[0_8px_24px_rgba(67,44,99,0.2)] transition-opacity duration-300 md:flex',
				direction === 1 ? '-right-4' : '-left-4',
				off && 'pointer-events-none opacity-0',
			)}
			onClick={() => step(direction)}
			tabIndex={off ? -1 : 0}
			type="button"
		>
			<svg aria-hidden="true" fill="none" height="17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 24 24" width="17">
				<path d={direction === 1 ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'} />
			</svg>
		</button>
	);

	return (
		<div className="relative">
			{arrow(-1, at.start)}
			<ul aria-label={label} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-4 lg:mx-0 lg:px-0" ref={row}>
				{products.map((product) => (
					<li className="w-[58%] shrink-0 snap-start sm:w-[38%] md:w-[28%] lg:w-[calc((100%-64px)/5)]" key={product.id}>
						<ProductCard product={product} user={user} wishlist={wishlist} />
					</li>
				))}
			</ul>
			{arrow(1, at.end)}
		</div>
	);
}
