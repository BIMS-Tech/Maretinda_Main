'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

// A filter is a display label + the category handle sent to the backend.
// The handle must match product_category.handle in Medusa.
export type TrendingFilter = { label: string; handle: string };

export const TrendingNowFilters = ({
	activeCategory,
	filters,
}: {
	activeCategory: string;
	filters: TrendingFilter[];
}) => {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	function select(handle: string) {
		const params = new URLSearchParams(searchParams.toString());
		if (handle === 'all') {
			params.delete('trend_cat');
		} else {
			params.set('trend_cat', handle);
		}
		startTransition(() => {
			router.push(`${pathname}?${params.toString()}`, { scroll: false });
		});
	}

	const active = activeCategory || 'all';

	return (
		<div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 pb-1">
			{filters.map((f) => {
				const isActive = active === f.handle;
				return (
					<button
						key={f.handle}
						onClick={() => select(f.handle)}
						disabled={isPending}
						className="px-4 h-9 rounded-full text-[12.5px] font-semibold transition-colors disabled:opacity-60 shrink-0 whitespace-nowrap"
						style={
							isActive
								? { backgroundColor: '#1B1B1B', color: 'white' }
								: { backgroundColor: 'white', color: '#1B1B1B', border: '1px solid #EDEAE3' }
						}
					>
						{f.label}
					</button>
				);
			})}
		</div>
	);
};
