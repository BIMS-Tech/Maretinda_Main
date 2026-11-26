'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import Image from 'next/image';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type KeyboardEvent, type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';

import { EASE_OUT, peso, SPRING } from '@/components/motion';
import { SearchIcon2 } from '@/icons';
import { cardImage } from '@/lib/helpers/card-image';
import { discountPercent } from '@/lib/helpers/product-card';
import { readListing } from '@/lib/listing';
import { cn } from '@/lib/utils';
import { openProduct } from '@/lib/view-transition';
import { useLanguage } from '@/providers/LanguageProvider';
import type { ProductCardData, SuggestResponse } from '@/types/search';

type Category = { id: string; name: string; handle: string };

const RECENT_KEY = 'maretinda_recent_searches';
const readRecent = (): string[] => {
	try {
		const list = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
		return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string').slice(0, 5) : [];
	} catch {
		return [];
	}
};
const saveRecent = (list: string[]) => {
	try {
		localStorage.setItem(RECENT_KEY, JSON.stringify(list));
	} catch {
		// Private browsing: just not remembered
	}
};

/** The words found, in bold. */
function Marked({ text, query }: { text: string; query: string }) {
	const words = query.trim().split(/\s+/).filter((w) => w.length > 1).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
	if (!words.length) return <>{text}</>;
	const parts = text.split(new RegExp(`(${words.join('|')})`, 'ig'));
	return (
		<>
			{parts.map((part, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: pieces of one title, in order
				i % 2 ? <mark className="bg-transparent font-bold text-[#432C63]" key={i}>{part}</mark> : <span key={i}>{part}</span>
			))}
		</>
	);
}

type Option = { id: string; run: () => void; content: ReactNode; kind: string };

/**
 * The store's search box: suggestions from the live catalogue while typing, and
 * the search page on Enter. A combobox: arrows move, Enter opens, Escape closes.
 */
export const NavbarSearch = ({ categories = [] }: { categories?: Category[] }) => {
	const { t } = useLanguage();
	const s = t.searchBox;
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { locale } = useParams<{ locale: string }>();
	const id = useId();

	const [text, setText] = useState('');
	const [categoryHandle, setCategoryHandle] = useState('all');
	const [open, setOpen] = useState(false);
	const [found, setFound] = useState<SuggestResponse | null>(null);
	const [busy, setBusy] = useState(false);
	const [failed, setFailed] = useState(false);
	const [at, setAt] = useState(-1);
	const [recent, setRecent] = useState<string[]>([]);
	const form = useRef<HTMLFormElement>(null);
	const input = useRef<HTMLInputElement>(null);
	const cache = useRef(new Map<string, SuggestResponse>());

	const category = categories.find((c) => c.handle === categoryHandle);
	const query = text.trim();

	// The box says what the page is showing, and empties when it shows something else
	const onSearchPage = /^\/[^/]+\/(search|categories\/)/.test(pathname);
	const pageQuery = onSearchPage ? readListing(new URLSearchParams(searchParams.toString())).q : '';
	useEffect(() => {
		setText(pageQuery);
		setOpen(false);
		// biome-ignore lint/correctness/useExhaustiveDependencies: also when moving between pages
	}, [pageQuery, pathname]);

	// Suggestions, a moment after typing stops. Only the newest answer counts.
	useEffect(() => {
		if (!open) return;
		const request = new URLSearchParams({ q: query, ...(category ? { category_id: category.id } : {}) }).toString();
		const before = cache.current.get(request);
		if (before) {
			setFound(before);
			setBusy(false);
			setFailed(false);
			return;
		}
		const stop = new AbortController();
		const timer = setTimeout(
			async () => {
				setBusy(true);
				try {
					const res = await fetch(`/api/search/suggest?${request}`, { signal: stop.signal });
					if (!res.ok) throw new Error(String(res.status));
					const data: SuggestResponse = await res.json();
					if (cache.current.size > 50) cache.current.clear();
					cache.current.set(request, data);
					setFound(data);
					setFailed(false);
				} catch (error) {
					if (stop.signal.aborted) return;
					console.error('[search box]', error);
					setFailed(true);
				} finally {
					if (!stop.signal.aborted) setBusy(false);
				}
			},
			query ? 140 : 0,
		);
		return () => {
			clearTimeout(timer);
			stop.abort();
		};
	}, [open, query, category]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: a new list starts unmarked
	useEffect(() => setAt(-1), [query, found]);

	useEffect(() => {
		if (!open) return;
		setRecent(readRecent());
		const away = (e: PointerEvent) => {
			if (!form.current?.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener('pointerdown', away);
		return () => document.removeEventListener('pointerdown', away);
	}, [open]);

	const close = () => {
		setOpen(false);
		input.current?.blur();
	};
	const remember = (q: string) => saveRecent([q, ...readRecent().filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, 5));

	const search = (q: string, inCategory = category) => {
		const words = q.trim();
		close();
		if (words) remember(words);
		if (inCategory) router.push(`/${locale}/categories/${inCategory.handle.trim()}${words ? `?q=${encodeURIComponent(words)}` : ''}`);
		else router.push(words ? `/${locale}/search?q=${encodeURIComponent(words)}` : `/${locale}/search`);
	};
	const go = (path: string) => {
		close();
		router.push(`/${locale}${path}`);
	};
	const open_ = (product: ProductCardData) => {
		if (query) remember(query);
		const picture = form.current?.querySelector<HTMLElement>(`[data-suggestion="${CSS.escape(product.id)}"]`) ?? null;
		openProduct(product, picture, () => router.push(`/${locale}/products/${product.handle}`));
		setOpen(false);
	};

	const upToDate = found && found.query === query ? found : null;
	const shownFound = upToDate ?? (query ? found : null);

	const options = useMemo<Option[]>(() => {
		const list: Option[] = [];
		if (!query) {
			for (const r of recent) {
				list.push({
					content: (
						<>
							<svg aria-hidden="true" className="shrink-0 text-[#B5AEBF]" fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="15"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
							<span className="truncate">{r}</span>
						</>
					),
					id: `recent-${r}`,
					kind: 'recent',
					run: () => search(r, undefined),
				});
			}
		}
		for (const c of shownFound?.categories ?? []) {
			list.push({ content: <><span className="truncate"><Marked query={query} text={c.name} /></span><span className="text-[11.5px] text-[#A39DAC]">{c.count}</span></>, id: `cat-${c.handle}`, kind: 'category', run: () => go(`/search?${new URLSearchParams({ ...(query ? { q: query } : {}), category: c.handle })}`) });
		}
		for (const p of shownFound?.products ?? []) {
			const image = cardImage(p.thumbnail);
			const off = discountPercent(p);
			list.push({
				content: (
					<>
						<span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#F3EFF8]" data-suggestion={p.id}>
							<Image alt="" className="object-contain p-1" fill sizes="48px" src={image || '/images/placeholder.svg'} />
						</span>
						<span className="min-w-0 flex-1">
							<span className="block truncate text-[13.5px] font-medium text-[#1B1B1B]"><Marked query={query} text={p.title} /></span>
							<span className="block truncate text-[12px] text-[#8A8493]">{p.brand || p.category?.name || p.seller?.name}</span>
						</span>
						<span className="shrink-0 text-right">
							<span className={cn('block text-[13px] font-bold', off ? 'text-[#C43131]' : 'text-[#432C63]')}>{p.price != null ? peso(p.price) : ''}</span>
							{off > 0 && <span className="block text-[11px] text-[#A39DAC] line-through">{peso(p.original_price as number)}</span>}
						</span>
					</>
				),
				id: `product-${p.id}`,
				kind: 'product',
				run: () => open_(p),
			});
		}
		for (const b of query ? (shownFound?.brands ?? []) : []) {
			list.push({ content: <span className="truncate"><Marked query={query} text={b.name} /></span>, id: `brand-${b.handle}`, kind: 'brand', run: () => go(`/search?${new URLSearchParams({ brand: b.handle })}`) });
		}
		for (const shop of query ? (shownFound?.shops ?? []) : []) {
			list.push({
				content: (
					<>
						<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#432C63] text-[10.5px] font-bold text-white">{shop.name.charAt(0).toUpperCase()}</span>
						<span className="truncate"><Marked query={query} text={shop.name} /></span>
					</>
				),
				id: `shop-${shop.handle}`,
				kind: 'shop',
				run: () => go(`/sellers/${shop.handle}`),
			});
		}
		return list;
		// biome-ignore lint/correctness/useExhaustiveDependencies: the handlers only use what is listed
	}, [query, recent, shownFound, category, locale]);

	const keys = (e: KeyboardEvent) => {
		if (e.key === 'Escape') return close();
		if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;
		e.preventDefault();
		if (!open) return setOpen(true);
		if (!options.length) return;
		setAt((i) => (e.key === 'ArrowDown' ? (i + 1) % options.length : i <= 0 ? options.length - 1 : i - 1));
	};

	const group = (kind: string, title: string, className: string, itemClass: string, aside?: ReactNode) => {
		const items = options.filter((o) => o.kind === kind);
		if (!items.length) return null;
		return (
			<div className="px-2 pt-2" key={kind}>
				<div className="flex items-center justify-between px-2 pb-1.5">
					<p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#A39DAC]">{title}</p>
					{aside}
				</div>
				<ul className={className} role="presentation">
					{items.map((o) => {
						const index = options.indexOf(o);
						const on = index === at;
						return (
							// biome-ignore lint/a11y/useKeyWithClickEvents: the input takes the keys (aria-activedescendant)
							<li
								aria-selected={on}
								className={cn('relative flex cursor-pointer items-center gap-3 text-[13px] text-[#404040]', itemClass)}
								id={`${id}-${o.id}`}
								key={o.id}
								onClick={o.run}
								onPointerMove={() => setAt(index)}
								role="option"
							>
								{on && <m.span className="absolute inset-0 rounded-xl bg-[#F6F2FB]" layoutId={`${id}-at`} transition={SPRING} />}
								<span className="relative flex min-w-0 flex-1 items-center gap-3">{o.content}</span>
							</li>
						);
					})}
				</ul>
			</div>
		);
	};

	const nothing = !!upToDate && !!query && upToDate.products.length === 0;

	return (
		// A real form: pressed before the page is interactive, Enter still opens the results
		<form
			action={`/${locale}/search`}
			className="relative w-full"
			method="get"
			onSubmit={(e) => {
				e.preventDefault();
				if (open && at >= 0 && options[at]) options[at].run();
				else search(text);
			}}
			ref={form}
			role="search"
		>
			<div
				className={cn(
					'flex w-full items-center rounded-full bg-white pl-4 pr-1.5 transition-shadow duration-300',
					open ? 'shadow-[0_0_0_3px_rgba(255,197,51,0.55),0_14px_34px_rgba(20,10,35,0.22)]' : 'shadow-[0_4px_12px_rgba(0,0,0,0.12)]',
				)}
			>
				<button aria-label={t.listing.search} className="press flex shrink-0 items-center justify-center" type="submit">
					<SearchIcon2 color="#372248" />
				</button>

				<div className="relative ml-2 flex shrink-0 items-center border-r border-[#E9E4EF] pr-2">
					<select
						aria-label="Filter by category"
						className="max-w-[104px] cursor-pointer appearance-none truncate bg-transparent py-3 pr-5 text-[13px] font-semibold text-[#404040] focus:outline-none sm:max-w-[132px]"
						onChange={(e) => {
							setCategoryHandle(e.target.value);
							input.current?.focus();
						}}
						value={categoryHandle}
					>
						<option value="all">{s.all}</option>
						{categories.map((cat) => (
							<option key={cat.id} value={cat.handle}>{cat.name}</option>
						))}
					</select>
					<svg aria-hidden="true" className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[#A39DAC]" fill="none" height="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24" width="13"><path d="M6 9l6 6 6-6" /></svg>
				</div>

				<input
					aria-activedescendant={open && at >= 0 && options[at] ? `${id}-${options[at].id}` : undefined}
					aria-autocomplete="list"
					aria-controls={`${id}-list`}
					aria-expanded={open}
					aria-label={t.listing.search}
					autoComplete="off"
					className="min-w-0 flex-1 border-0 bg-transparent py-3 pl-3 pr-2 text-[16px] text-[#1B1B1B] placeholder:text-[#A39DAC] focus:outline-none focus:ring-0 lg:text-[15px]"
					enterKeyHint="search"
					maxLength={120}
					name="q"
					onChange={(e) => {
						setText(e.target.value);
						setOpen(true);
					}}
					onFocus={() => setOpen(true)}
					onKeyDown={keys}
					placeholder={category ? s.searchIn(category.name) : s.placeholder}
					ref={input}
					role="combobox"
					type="text"
					value={text}
				/>

				<AnimatePresence>
					{text && (
						<m.button
							animate={{ opacity: 1, scale: 1 }}
							aria-label={s.clear}
							className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#A39DAC] transition-colors hover:bg-[#F6F2FB] hover:text-[#432C63]"
							exit={{ opacity: 0, scale: 0.5 }}
							initial={{ opacity: 0, scale: 0.5 }}
							onClick={() => {
								setText('');
								input.current?.focus();
							}}
							transition={SPRING}
							type="button"
						>
							<svg aria-hidden="true" fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" viewBox="0 0 24 24" width="15"><path d="M6 6l12 12M18 6L6 18" /></svg>
						</m.button>
					)}
				</AnimatePresence>
			</div>

			<AnimatePresence>
				{open && (
					<m.div
						animate={{ opacity: 1, scale: 1, y: 0 }}
						className="absolute inset-x-0 top-[calc(100%+10px)] z-50 origin-top overflow-hidden rounded-[22px] border border-[#EDE8F2] bg-white text-left shadow-[0_30px_70px_-18px_rgba(30,20,48,0.45)]"
						data-testid="search-suggestions"
						exit={{ opacity: 0, scale: 0.985, y: -6 }}
						initial={{ opacity: 0, scale: 0.98, y: -10 }}
						transition={{ duration: 0.26, ease: EASE_OUT }}
					>
						<div aria-hidden="true" className={cn('h-[2px] origin-left bg-[#FFC533] transition-[transform,opacity] ease-out', busy ? 'scale-x-100 opacity-100 duration-700' : 'scale-x-0 opacity-0 duration-200')} />
						<div className="max-h-[min(70dvh,560px)] overflow-y-auto overscroll-contain pb-2" id={`${id}-list`} role="listbox">
							{failed && <p className="px-4 py-5 text-[13px] text-[#737373]">{s.failed}</p>}
							{group(
								'recent',
								s.recent,
								'',
								'rounded-xl px-2.5 py-2',
								<button
									className="text-[11.5px] font-semibold text-[#432C63] hover:underline"
									onClick={() => {
										saveRecent([]);
										setRecent([]);
									}}
									type="button"
								>
									{s.clearRecent}
								</button>,
							)}
							{group('category', s.categories, 'flex flex-wrap gap-1.5 px-2', 'rounded-full border border-[#EDE8F2] px-3 py-1.5 !gap-1.5 [&>span.absolute]:rounded-full font-semibold')}
							{nothing && (
								<div className="px-4 pb-1 pt-4 text-[13px] text-[#737373]">
									{s.noResults(query)}
									{upToDate?.did_you_mean && (
										<button className="ml-1.5 font-bold text-[#432C63] underline underline-offset-2" onClick={() => setText(upToDate.did_you_mean as string)} type="button">
											{t.listing.didYouMean(upToDate.did_you_mean)}
										</button>
									)}
								</div>
							)}
							{group('product', query ? s.products : s.popular, '', 'rounded-xl px-2 py-1.5')}
							{group('brand', s.brands, 'flex flex-wrap gap-1.5 px-2', 'rounded-full border border-[#EDE8F2] px-3 py-1.5 [&>span.absolute]:rounded-full font-semibold')}
							{group('shop', s.shops, 'grid sm:grid-cols-2', 'rounded-xl px-2.5 py-2 font-semibold')}
							{!shownFound && !failed && (
								<div aria-hidden="true" className="space-y-3 px-4 py-4">
									{[0, 1, 2].map((i) => (
										<div className="flex items-center gap-3" key={i}>
											<div className="shimmer h-12 w-12 rounded-xl" />
											<div className="flex-1 space-y-2">
												<div className="shimmer h-3 w-2/3 rounded-full" />
												<div className="shimmer h-2.5 w-1/3 rounded-full" />
											</div>
										</div>
									))}
								</div>
							)}
						</div>
						{!!query && !!upToDate && upToDate.count > upToDate.products.length && (
							<button className="group flex w-full items-center justify-center gap-2 border-t border-[#F0ECF4] py-3 text-[13px] font-bold text-[#432C63] transition-colors hover:bg-[#F6F2FB]" type="submit">
								{s.seeAll(upToDate.count, query)}
								<svg aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 24 24" width="14"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
							</button>
						)}
					</m.div>
				)}
			</AnimatePresence>
		</form>
	);
};
