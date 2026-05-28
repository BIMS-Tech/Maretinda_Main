'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

// Maps display label → category handle sent to the backend.
// The handle must match product_category.handle in Medusa.
const FILTERS: { label: string; handle: string }[] = [
	{ label: 'All',     handle: 'all'     },
	{ label: 'Fashion', handle: 'fashion' },
	{ label: 'Beauty',  handle: 'beauty'  },
	{ label: 'Tech',    handle: 'tech'    },
	{ label: 'Home',    handle: 'home'    },
	{ label: 'Food',    handle: 'food'    },
];

export const TrendingNowFilters = ({ activeCategory }: { activeCategory: string }) => {
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
		<div className="flex items-center gap-2 flex-wrap">
			{FILTERS.map((f) => {
				const isActive = active === f.handle;
				return (
					<button
						key={f.handle}
						onClick={() => select(f.handle)}
						disabled={isPending}
						className="px-4 h-9 rounded-full text-[12.5px] font-semibold transition-colors disabled:opacity-60"
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
