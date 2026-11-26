'use client';

import type { HttpTypes } from '@medusajs/types';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AnimatedNumber, EASE_OUT, MorphButton, Reveal, Segmented, SPRING_SOFT } from '@/components/motion';
import { activeFilterCount, clearFilters, type ListingState, listingRequest, readListing, writeListing } from '@/lib/listing';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/providers/LanguageProvider';
import type { ListingScope, ProductCardData, SearchResponse, Sort } from '@/types/search';
import type { Wishlist } from '@/types/wishlist';

import { ProductBigCard } from '../ProductCard/ProductBigCard';
import { ProductCard } from '../ProductCard/ProductCard';
import { ActiveFilters } from './ActiveFilters';
import { FilterSheet } from './FilterSheet';
import { Filters } from './Filters';
import { SortMenu } from './SortMenu';

type Listing = { results: SearchResponse; products: ProductCardData[]; page: number };

/** What has been loaded, so going back to a listing shows it as it was left. */
const remembered = new Map<string, Listing>();
const remember = (key: string, listing: Listing) => {
	remembered.delete(key);
	remembered.set(key, listing);
	if (remembered.size > 30) remembered.delete(remembered.keys().next().value as string);
};

const fetchPage = async (request: string, signal?: AbortSignal): Promise<SearchResponse> => {
	const res = await fetch(`/api/search?${request}`, { signal });
	if (!res.ok) throw new Error(String(res.status));
	return res.json();
};

const GridIcon = () => (
	<svg aria-hidden="true" fill="currentColor" height="15" viewBox="0 0 24 24" width="15"><rect height="8" rx="2" width="8" x="3" y="3" /><rect height="8" rx="2" width="8" x="13" y="3" /><rect height="8" rx="2" width="8" x="3" y="13" /><rect height="8" rx="2" width="8" x="13" y="13" /></svg>
);
const RowsIcon = () => (
	<svg aria-hidden="true" fill="currentColor" height="15" viewBox="0 0 24 24" width="15"><rect height="7" rx="2" width="18" x="3" y="3.500" /><rect height="7" rx="2" width="18" x="3" y="13.500" /></svg>
);

/**
 * A product listing with its filters and order. Everything the shopper picks is
 * in the address; the page around it isn't reloaded, only the products.
 */
export function ProductBrowser({
	initial,
	initialRequest,
	scope,
	user,
	wishlist,
	hideFilters = [],
	emptyHref = '/categories',
}: {
	/** The first page, loaded with the page itself */
	initial: SearchResponse | null;
	/** The request `initial` answers */
	initialRequest: string;
	scope: ListingScope;
	user: HttpTypes.StoreCustomer | null;
	wishlist: Wishlist[];
	hideFilters?: string[];
	emptyHref?: string;
}) {
	const { t } = useLanguage();
	const s = t.listing;
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const state = useMemo(() => readListing(new URLSearchParams(searchParams.toString())), [searchParams]);
	const key = listingRequest(state, scope);

	const [listing, setListing] = useState<Listing | null>(() => {
		const before = remembered.get(key);
		if (before) return before;
		return initial ? { page: 1, products: initial.products, results: initial } : null;
	});
	const [shownKey, setShownKey] = useState(() => (remembered.has(key) || key === initialRequest ? key : ''));
	const [failed, setFailed] = useState(!initial && !remembered.has(key));
	const [loadingMore, setLoadingMore] = useState(false);
	const [sheet, setSheet] = useState(false);
	const [view, setView] = useState<'grid' | 'rows'>('grid');
	const [attempt, setAttempt] = useState(0);
	const top = useRef<HTMLDivElement>(null);
	const loading = shownKey !== key && !failed;

	useEffect(() => {
		if (localStorage.getItem('maretinda_listing_view') === 'rows') setView('rows');
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: `attempt` is "try again"
	useEffect(() => {
		if (shownKey === key && !failed) return;
		const before = remembered.get(key);
		if (before) {
			setListing(before);
			setShownKey(key);
			setFailed(false);
			return;
		}
		const stop = new AbortController();
		fetchPage(key, stop.signal)
			.then((results) => {
				const next = { page: 1, products: results.products, results };
				remember(key, next);
				setListing(next);
				setShownKey(key);
				setFailed(false);
			})
			.catch((error) => {
				if (stop.signal.aborted) return;
				console.error('[listing]', error);
				setFailed(true);
			});
		return () => stop.abort();
	}, [key, attempt]);

	// A page refreshed by the server (something went into the cart) brings newer products
	useEffect(() => {
		if (!initial || initialRequest !== key || remembered.has(key)) return;
		setListing({ page: 1, products: initial.products, results: initial });
		setShownKey(key);
	}, [initial, initialRequest, key]);

	const change = useCallback(
		(next: ListingState) => {
			const query = writeListing(next).toString();
			window.history.pushState(null, '', query ? `${pathname}?${query}` : pathname);
			setFailed(false);
			const start = top.current?.getBoundingClientRect().top ?? 0;
			if (start < 0) window.scrollTo({ behavior: 'smooth', top: window.scrollY + start - 150 });
		},
		[pathname],
	);

	const more = async () => {
		if (!listing || loadingMore) return;
		setLoadingMore(true);
		try {
			const results = await fetchPage(listingRequest(state, scope, listing.page + 1));
			const have = new Set(listing.products.map((p) => p.id));
			const next = { page: listing.page + 1, products: [...listing.products, ...results.products.filter((p) => !have.has(p.id))], results: { ...results, facets: listing.results.facets } };
			remember(key, next);
			setListing(next);
		} catch (error) {
			console.error('[listing]', error);
		} finally {
			setLoadingMore(false);
		}
	};

	if (!listing) {
		return (
			<div className="rounded-[24px] bg-[#F8F5FB] px-6 py-16 text-center">
				<h2 className="text-[20px] font-bold text-[#1B1B1B]">{s.failedTitle}</h2>
				<p className="mt-2 text-[14px] text-[#737373]">{s.failedText}</p>
				<button className="press mt-5 h-11 rounded-full bg-[#432C63] px-6 text-[13.5px] font-bold text-white" onClick={() => setAttempt((n) => n + 1)} type="button">
					{s.tryAgain}
				</button>
			</div>
		);
	}

	const { results, products } = listing;
	const on = activeFilterCount(state);
	const sort: Sort = state.sort ?? (state.q ? 'relevance' : 'popular');
	const hasMore = products.length < results.count;
	const filters = <Filters hide={hideFilters} onChange={change} results={results} state={state} />;

	return (
		<div data-loading={loading || undefined} data-testid="product-browser" ref={top}>
			{/* Toolbar */}
			<div className="mb-5 flex flex-wrap items-center gap-3">
				<button
					className="press flex h-11 items-center gap-2 rounded-full border border-[#E7E1EE] bg-white px-4 text-[13px] font-bold text-[#1B1B1B] lg:hidden"
					onClick={() => setSheet(true)}
					type="button"
				>
					<svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" viewBox="0 0 24 24" width="16"><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2.200" /><circle cx="8" cy="17" r="2.200" /></svg>
					{s.filters}
					{on > 0 && <span className="pop-in flex h-5 min-w-5 items-center justify-center rounded-full bg-[#432C63] px-1.5 text-[11px] text-white" key={on}>{on}</span>}
				</button>
				<p aria-live="polite" className="order-last w-full text-[13.5px] text-[#737373] sm:order-none sm:w-auto" data-testid="result-count">
					<AnimatedNumber className="font-bold text-[#1B1B1B]" duration={0.5} value={results.count} /> {results.count === 1 ? s.product : s.products}
				</p>
				<div className="ml-auto flex items-center gap-2">
					<SortMenu onChange={(next) => change({ ...state, sort: next === (state.q ? 'relevance' : 'popular') ? null : next })} searching={!!state.q} value={sort} />
					<Segmented
						className="hidden h-11 sm:inline-flex"
						label={s.view}
						onChange={(v) => {
							setView(v);
							localStorage.setItem('maretinda_listing_view', v);
						}}
						options={[
							{ label: <><GridIcon /><span className="sr-only">{s.grid}</span></>, value: 'grid' },
							{ label: <><RowsIcon /><span className="sr-only">{s.rows}</span></>, value: 'rows' },
						]}
						value={view}
					/>
				</div>
			</div>

			<ActiveFilters
				hide={hideFilters}
				onChange={change}
				results={results}
				showQuery={!!(scope.category_id || scope.collection_id || scope.seller)}
				state={state}
			/>

			<div className="flex items-start gap-8">
				<aside aria-label={s.filters} className="sticky top-[132px] hidden max-h-[calc(100vh-150px)] w-[256px] shrink-0 overflow-y-auto overscroll-contain rounded-[22px] border border-[#EFEAF4] bg-white px-5 py-4 [scrollbar-width:thin] lg:block">
					{filters}
				</aside>

				<div className="relative min-w-0 flex-1">
					{/* A thin line while new products load; the old ones stay put */}
					<div aria-hidden="true" className={cn('absolute -top-2 left-0 h-[2px] rounded-full bg-[#432C63] transition-[width,opacity] ease-out', loading ? 'w-4/5 opacity-100 duration-1200' : 'w-full opacity-0 duration-300')} />

					{(results.relaxed || (results.did_you_mean && results.count > 0)) && state.q && (
						<p className="mb-5 rounded-2xl bg-[#FFF8E6] px-4 py-3 text-[13.5px] text-[#5B4A1B]">
							{results.relaxed && s.relaxed(state.q)}{' '}
							{results.did_you_mean && (
								<button className="font-bold underline underline-offset-2" onClick={() => change({ ...clearFilters(state), q: results.did_you_mean as string })} type="button">
									{s.didYouMean(results.did_you_mean)}
								</button>
							)}
						</p>
					)}

					{products.length === 0 ? (
						<m.div animate={{ opacity: 1, y: 0 }} className="rounded-[24px] bg-[#F8F5FB] px-6 py-16 text-center" data-testid="no-results" initial={{ opacity: 0, y: 14 }} transition={{ duration: 0.5, ease: EASE_OUT }}>
							<svg aria-hidden="true" className="mx-auto mb-5 text-[#B79AE0]" fill="none" height="60" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" viewBox="0 0 48 48" width="60">
								<circle cx="21" cy="21" r="13" /><path d="M31 31l10 10M16.500 24.500c2.700-2.600 6.300-2.600 9 0M17 17.500h.01M25 17.500h.01" />
							</svg>
							<h2 className="text-[20px] font-bold text-[#1B1B1B]">{state.q ? s.noResultsFor(state.q) : s.noResults}</h2>
							<p className="mx-auto mt-2 max-w-md text-[14px] text-[#737373]">{on > 0 ? s.noResultsFilters : s.noResultsText}</p>
							<div className="mt-6 flex flex-wrap justify-center gap-3">
								{results.did_you_mean && (
									<button className="press h-11 rounded-full bg-[#FFC533] px-6 text-[13.5px] font-bold text-[#432C63]" onClick={() => change({ ...clearFilters(state), q: results.did_you_mean as string })} type="button">
										{s.didYouMean(results.did_you_mean)}
									</button>
								)}
								{on > 0 ? (
									<button className="press h-11 rounded-full bg-[#432C63] px-6 text-[13.5px] font-bold text-white" onClick={() => change(clearFilters(state))} type="button">
										{s.clearFilters}
									</button>
								) : (
									<Link className="press inline-flex h-11 items-center rounded-full bg-[#432C63] px-6 text-[13.5px] font-bold text-white" href={emptyHref}>
										{s.browseAll}
									</Link>
								)}
							</div>
						</m.div>
					) : (
						<ul
							className={cn(
								'relative transition-opacity duration-300',
								view === 'grid' ? 'grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4' : 'flex flex-col gap-4',
								loading && 'opacity-60',
							)}
							data-testid="products"
						>
							<AnimatePresence initial={false} mode="popLayout">
								{products.map((product, i) => (
									<m.li
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2, ease: EASE_OUT } }}
										initial={{ opacity: 0, scale: 0.92 }}
										key={product.id}
										layout="position"
										transition={{ ...SPRING_SOFT, delay: Math.min((i % 24) * 0.018, 0.22), layout: SPRING_SOFT, opacity: { delay: Math.min((i % 24) * 0.018, 0.22), duration: 0.35 } }}
									>
										{view === 'grid' ? (
											<ProductCard priority={i < 4} product={product} user={user} wishlist={wishlist} />
										) : (
											<ProductBigCard product={product} user={user} wishlist={wishlist} />
										)}
									</m.li>
								))}
							</AnimatePresence>
						</ul>
					)}

					{products.length > 0 && (
						<Reveal className="mt-12 flex flex-col items-center gap-4" variant="fade">
							<p className="text-[12.5px] text-[#8A8493]">{s.showing(products.length, results.count)}</p>
							<div aria-hidden="true" className="h-1 w-44 overflow-hidden rounded-full bg-[#EDE8F2]">
								<div className="h-full origin-left rounded-full bg-[#432C63] transition-transform duration-700 ease-soft" style={{ transform: `scaleX(${Math.min(1, products.length / Math.max(1, results.count))})` }} />
							</div>
							{hasMore && (
								<MorphButton
									busy={s.loading}
									className="mt-1 h-12 rounded-full border border-[#432C63] bg-white px-8 text-[13.5px] font-bold text-[#432C63] hover:bg-[#432C63] hover:text-white"
									done={s.loadMore}
									idle={s.loadMore}
									onClick={more}
									state={loadingMore ? 'busy' : 'idle'}
									type="button"
								/>
							)}
						</Reveal>
					)}
				</div>
			</div>

			<FilterSheet
				footer={
					<div className="flex gap-3">
						<button className="press h-12 flex-1 rounded-full border border-[#E7E1EE] text-[13.5px] font-bold text-[#404040] disabled:opacity-40" disabled={!on} onClick={() => change(clearFilters(state))} type="button">
							{s.clearAll}
						</button>
						<button className="press h-12 flex-[2] rounded-full bg-[#432C63] text-[13.5px] font-bold text-white" onClick={() => setSheet(false)} type="button">
							{s.show} <AnimatedNumber duration={0.4} value={results.count} /> {results.count === 1 ? s.product : s.products}
						</button>
					</div>
				}
				onClose={() => setSheet(false)}
				open={sheet}
				title={s.filters}
			>
				{filters}
			</FilterSheet>
		</div>
	);
}
