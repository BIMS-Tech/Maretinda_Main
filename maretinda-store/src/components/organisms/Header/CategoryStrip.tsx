'use client';

import type { HttpTypes } from '@medusajs/types';
import * as m from 'motion/react-m';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { SPRING } from '@/components/motion';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { NavText } from '@/i18n/NavText';
import { cn } from '@/lib/utils';

/** The categories under the header, with a pill that follows the pointer. */
export function CategoryStrip({ categories }: { categories: HttpTypes.StoreProductCategory[] }) {
	const pathname = usePathname();
	const [over, setOver] = useState<string | null>(null);

	return (
		<div className="border-t border-white/10">
			<div className="mx-auto flex h-11 max-w-[1360px] items-center gap-1 px-6 text-[13px]">
				<LocalizedClientLink className="press flex shrink-0 items-center gap-2 rounded-full bg-white/[0.13] px-3.5 py-1.5 font-semibold text-white hover:bg-white/20" href="/categories">
					<svg aria-hidden="true" fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="15"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
					<NavText k="allCategories" />
				</LocalizedClientLink>
				<span className="mx-1 shrink-0 text-white opacity-20">|</span>

				<nav className="no-scrollbar flex min-w-0 flex-1 items-center overflow-x-auto" onPointerLeave={() => setOver(null)}>
					{categories.map((cat) => {
						const here = pathname.split('/')[3] === cat.handle.trim() && pathname.includes('/categories/');
						return (
							<LocalizedClientLink
								aria-current={here ? 'page' : undefined}
								className={cn('relative shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 transition-colors', here ? 'font-bold text-[#FFC533]' : 'text-white/85 hover:text-white')}
								href={`/categories/${cat.handle.trim()}`}
								key={cat.id}
								onPointerEnter={() => setOver(cat.id)}
							>
								{over === cat.id && <m.span className="absolute inset-0 rounded-full bg-white/[0.12]" layoutId="category-strip" transition={SPRING} />}
								<span className="relative">{cat.name}</span>
							</LocalizedClientLink>
						);
					})}
				</nav>

				<LocalizedClientLink className="press ml-1 flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-bold text-[#FFC533]" href="/flash-sale">
					<span className="relative flex h-2 w-2">
						<span className="absolute inset-0 animate-ping rounded-full bg-[#FFC533] opacity-75 motion-reduce:hidden" />
						<span className="relative inline-block h-2 w-2 rounded-full bg-[#FFC533]" />
					</span>
					<NavText k="flashSale" />
				</LocalizedClientLink>
			</div>
		</div>
	);
}
