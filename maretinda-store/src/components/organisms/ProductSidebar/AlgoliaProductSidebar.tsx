'use client';

import { MagnifyingGlass, Minus } from '@medusajs/icons';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useRefinementList } from 'react-instantsearch';

import useFilters from '@/hooks/useFilters';
import useGetAllSearchParams from '@/hooks/useGetAllSearchParams';
import useUpdateSearchParams from '@/hooks/useUpdateSearchParams';
import { cn } from '@/lib/utils';

// ─── helpers ────────────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = {
	php: '₱',
	usd: '$',
	eur: '€',
	gbp: '£',
	jpy: '¥',
	aud: 'A$',
	cad: 'C$',
};

function getCurrencySymbol(code?: string) {
	return CURRENCY_SYMBOLS[code?.toLowerCase() ?? ''] ?? '₱';
}

// ─── FilterSection wrapper ───────────────────────────────────────────────────

function FilterSection({
	title,
	activeCount = 0,
	defaultOpen = true,
	onClear,
	children,
}: {
	title: string;
	activeCount?: number;
	defaultOpen?: boolean;
	onClear?: () => void;
	children: React.ReactNode;
}) {
	const [open, setOpen] = useState(defaultOpen);
	const contentRef = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState(0);

	useEffect(() => {
		const el = contentRef.current;
		if (!el) return;
		const observer = new ResizeObserver(() => setHeight(el.scrollHeight));
		observer.observe(el);
		setHeight(el.scrollHeight);
		return () => observer.disconnect();
	}, [children]);

	return (
		<div className="border-b border-gray-100 pb-5">
			<button
				className="w-full flex items-center justify-between py-1 group"
				onClick={() => setOpen((v) => !v)}
				type="button"
			>
				<div className="flex items-center gap-2">
					<span className="text-sm font-semibold text-gray-800 tracking-wide uppercase">
						{title}
					</span>
					{activeCount > 0 && (
						<span className="bg-[#372248] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
							{activeCount}
						</span>
					)}
				</div>
				<div className="flex items-center gap-2">
					{activeCount > 0 && onClear && (
						<span
							className="text-xs text-[#372248] hover:underline font-medium"
							onClick={(e) => {
								e.stopPropagation();
								onClear();
							}}
						>
							Clear
						</span>
					)}
					<svg
						className={cn(
							'w-4 h-4 text-gray-400 transition-transform duration-300',
							open && 'rotate-180',
						)}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							d="M19 9l-7 7-7-7"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
						/>
					</svg>
				</div>
			</button>

			<div
				className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
				style={{
					maxHeight: open ? `${height + 24}px` : '0px',
					opacity: open ? 1 : 0,
				}}
			>
				<div className="pt-4" ref={contentRef}>
					{children}
				</div>
			</div>
		</div>
	);
}

// ─── Main sidebar ────────────────────────────────────────────────────────────

export const AlgoliaProductSidebar = ({
	isModal = false,
	currency_code,
}: {
	isModal?: boolean;
	currency_code?: string;
}) => {
	const { allSearchParams, count } = useGetAllSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	return (
		<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-5">
			{/* Header */}
			<div className="flex items-center justify-between pb-4 border-b border-gray-100">
				<div className="flex items-center gap-2">
					<svg
						className="w-4 h-4 text-[#372248]"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
						/>
					</svg>
					<span className="font-bold text-gray-900 text-base">
						Filters
					</span>
					{count > 0 && (
						<span className="bg-[#372248] text-white text-xs font-bold rounded-full px-2 py-0.5">
							{count}
						</span>
					)}
				</div>
				{count > 0 && (
					<button
						className="text-xs text-[#372248] hover:underline font-semibold"
						onClick={() => router.push(pathname, { scroll: false })}
						type="button"
					>
						Clear all
					</button>
				)}
			</div>

			{/* Filter sections */}
			<CategoryNameFilter
				defaultOpen={!isModal || Boolean(allSearchParams.category_name)}
			/>
			<ProductTypeFilter
				defaultOpen={!isModal || Boolean(allSearchParams.type)}
			/>
			<StoreFilter
				defaultOpen={!isModal || Boolean(allSearchParams.store)}
			/>
			<BrandFilter
				defaultOpen={!isModal || Boolean(allSearchParams.brand)}
			/>
			<PriceFilter
				currency_code={currency_code}
				defaultOpen={
					!isModal ||
					Boolean(
						allSearchParams.min_price || allSearchParams.max_price,
					)
				}
			/>
			<ConditionFilter
				defaultOpen={!isModal || Boolean(allSearchParams.condition)}
			/>
			<SizeFilter
				defaultOpen={!isModal || Boolean(allSearchParams.size)}
			/>
			<ColorFilter
				defaultOpen={!isModal || Boolean(allSearchParams.color)}
			/>
			<RatingFilter
				defaultOpen={!isModal || Boolean(allSearchParams.rating)}
			/>
		</div>
	);
};

// ─── Category name filter (universal — works across all product types) ───────

function CategoryNameFilter({ defaultOpen = false }: { defaultOpen?: boolean }) {
	const { items } = useRefinementList({
		attribute: 'categories.name',
		limit: 50,
		operator: 'or',
		sortBy: ['count:desc', 'name:asc'],
	});
	const { updateFilters, isFilterActive, filters, clearAllFilters } =
		useFilters('category_name');

	if (!items.length) return null;

	return (
		<FilterSection
			activeCount={filters.length}
			defaultOpen={defaultOpen}
			onClear={clearAllFilters}
			title="Category"
		>
			<ul className="space-y-2 max-h-52 overflow-y-auto pr-1">
				{items.map(({ label, count }) => (
					<li key={label}>
						<label className="flex items-center gap-2.5 cursor-pointer group">
							<div
								className={cn(
									'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0',
									isFilterActive(label)
										? 'bg-[#372248] border-[#372248]'
										: 'border-gray-300 group-hover:border-[#372248]',
									!count && 'opacity-40',
								)}
								onClick={() => count && updateFilters(label)}
							>
								{isFilterActive(label) && (
									<svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
										<path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd" />
									</svg>
								)}
							</div>
							<span
								className={cn(
									'text-sm flex-1 truncate transition-colors',
									isFilterActive(label) ? 'text-[#372248] font-medium' : 'text-gray-700 group-hover:text-gray-900',
									!count && 'opacity-40',
								)}
								onClick={() => count && updateFilters(label)}
							>
								{label}
							</span>
							<span className="text-xs text-gray-400 font-medium shrink-0">{count}</span>
						</label>
					</li>
				))}
			</ul>
		</FilterSection>
	);
}

// ─── Product type filter (electronics, clothing, appliances…) ────────────────

function ProductTypeFilter({ defaultOpen = false }: { defaultOpen?: boolean }) {
	const { items } = useRefinementList({
		attribute: 'type.value',
		limit: 30,
		operator: 'or',
		sortBy: ['count:desc', 'name:asc'],
	});
	const { updateFilters, isFilterActive, filters, clearAllFilters } =
		useFilters('type');

	if (!items.length) return null;

	return (
		<FilterSection
			activeCount={filters.length}
			defaultOpen={defaultOpen}
			onClear={clearAllFilters}
			title="Product Type"
		>
			<div className="flex flex-wrap gap-2">
				{items.map(({ label, count }) => (
					<button
						className={cn(
							'px-3 py-1.5 rounded-full border text-sm font-medium transition-all',
							isFilterActive(label)
								? 'bg-[#372248] text-white border-[#372248] shadow-sm'
								: 'bg-white text-gray-700 border-gray-200 hover:border-[#372248] hover:text-[#372248]',
							!count && 'opacity-40 cursor-not-allowed',
						)}
						disabled={!count}
						key={label}
						onClick={() => count && updateFilters(label)}
						type="button"
					>
						{label}
						<span className={cn('ml-1.5 text-xs', isFilterActive(label) ? 'text-white/70' : 'text-gray-400')}>
							{count}
						</span>
					</button>
				))}
			</div>
		</FilterSection>
	);
}

// ─── Store filter ────────────────────────────────────────────────────────────

function StoreFilter({ defaultOpen = true }: { defaultOpen?: boolean }) {
	const { items } = useRefinementList({
		attribute: 'seller.handle',
		limit: 100,
		operator: 'or',
	});
	const { updateFilters, isFilterActive, filters, clearAllFilters } =
		useFilters('store');
	const [search, setSearch] = useState('');

	const filtered = search.trim()
		? items.filter((i) =>
				i.label.toLowerCase().includes(search.toLowerCase()),
			)
		: items;

	return (
		<FilterSection
			activeCount={filters.length}
			defaultOpen={defaultOpen}
			onClear={clearAllFilters}
			title="Store"
		>
			<div className="relative mb-3">
				<MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
				<input
					className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#372248] bg-gray-50"
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search stores..."
					value={search}
				/>
			</div>
			<ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
				{filtered.map(({ label, count }) => (
					<li key={label}>
						<label className="flex items-center gap-2.5 cursor-pointer group">
							<div
								className={cn(
									'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
									isFilterActive(label)
										? 'bg-[#372248] border-[#372248]'
										: 'border-gray-300 group-hover:border-[#372248]',
									!count && 'opacity-40',
								)}
								onClick={() => count && updateFilters(label)}
							>
								{isFilterActive(label) && (
									<svg
										className="w-2.5 h-2.5 text-white"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											clipRule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											fillRule="evenodd"
										/>
									</svg>
								)}
							</div>
							<span
								className={cn(
									'text-sm flex-1 transition-colors',
									isFilterActive(label)
										? 'text-[#372248] font-medium'
										: 'text-gray-700 group-hover:text-gray-900',
									!count && 'opacity-40',
								)}
								onClick={() => count && updateFilters(label)}
							>
								{label}
							</span>
							<span className="text-xs text-gray-400 font-medium">
								{count}
							</span>
						</label>
					</li>
				))}
				{filtered.length === 0 && (
					<p className="text-xs text-gray-400 text-center py-2">
						No stores found
					</p>
				)}
			</ul>
		</FilterSection>
	);
}

// ─── Brand filter ────────────────────────────────────────────────────────────

function BrandFilter({ defaultOpen = true }: { defaultOpen?: boolean }) {
	const { items } = useRefinementList({
		attribute: 'brand.name',
		limit: 100,
		operator: 'or',
	});
	const { updateFilters, isFilterActive, filters, clearAllFilters } =
		useFilters('brand');
	const [search, setSearch] = useState('');

	const filtered = search.trim()
		? items.filter((i) =>
				i.label.toLowerCase().includes(search.toLowerCase()),
			)
		: items;

	return (
		<FilterSection
			activeCount={filters.length}
			defaultOpen={defaultOpen}
			onClear={clearAllFilters}
			title="Brand"
		>
			<div className="relative mb-3">
				<MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
				<input
					className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#372248] bg-gray-50"
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search brands..."
					value={search}
				/>
			</div>
			<ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
				{filtered.map(({ label, count }) => (
					<li key={label}>
						<label className="flex items-center gap-2.5 cursor-pointer group">
							<div
								className={cn(
									'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
									isFilterActive(label)
										? 'bg-[#372248] border-[#372248]'
										: 'border-gray-300 group-hover:border-[#372248]',
									!count && 'opacity-40',
								)}
								onClick={() => count && updateFilters(label)}
							>
								{isFilterActive(label) && (
									<svg
										className="w-2.5 h-2.5 text-white"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											clipRule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											fillRule="evenodd"
										/>
									</svg>
								)}
							</div>
							<span
								className={cn(
									'text-sm flex-1 transition-colors',
									isFilterActive(label)
										? 'text-[#372248] font-medium'
										: 'text-gray-700 group-hover:text-gray-900',
									!count && 'opacity-40',
								)}
								onClick={() => count && updateFilters(label)}
							>
								{label}
							</span>
							<span className="text-xs text-gray-400 font-medium">
								{count}
							</span>
						</label>
					</li>
				))}
				{filtered.length === 0 && (
					<p className="text-xs text-gray-400 text-center py-2">
						No brands found
					</p>
				)}
			</ul>
		</FilterSection>
	);
}

// ─── Price filter ────────────────────────────────────────────────────────────

function PriceFilter({
	defaultOpen = true,
	currency_code,
}: {
	defaultOpen?: boolean;
	currency_code?: string;
}) {
	const symbol = getCurrencySymbol(currency_code);
	const [min, setMin] = useState('');
	const [max, setMax] = useState('');
	const updateSearchParams = useUpdateSearchParams();
	const searchParams = useSearchParams();
	const { isFilterActive } = useFilters('max_price');

	useEffect(() => {
		setMin(searchParams.get('min_price') || '');
		setMax(searchParams.get('max_price') || '');
	}, [searchParams]);

	// Presets in display units (pesos/dollars). get-faced-filters multiplies ×100 for Algolia.
	const presets = [
		{ label: `Under ${symbol}500`, value: '500' },
		{ label: `Under ${symbol}2,000`, value: '2000' },
		{ label: `Under ${symbol}5,000`, value: '5000' },
	];

	const activeCount =
		(searchParams.get('min_price') ? 1 : 0) +
		(searchParams.get('max_price') ? 1 : 0);

	const clearPrice = () => {
		setMin('');
		setMax('');
		updateSearchParams('min_price', null);
		updateSearchParams('max_price', null);
	};

	return (
		<FilterSection
			activeCount={activeCount}
			defaultOpen={defaultOpen}
			onClear={clearPrice}
			title={`Price (${currency_code?.toUpperCase() ?? 'PHP'})`}
		>
			{/* Preset chips */}
			<div className="space-y-2 mb-4">
				{presets.map(({ label, value }) => (
					<button
						className={cn(
							'w-full text-left px-3 py-2 rounded-lg text-sm border transition-all',
							isFilterActive(value)
								? 'bg-[#372248] text-white border-[#372248] font-medium'
								: 'bg-gray-50 text-gray-700 border-gray-200 hover:border-[#372248] hover:bg-purple-50',
						)}
						key={value}
						onClick={() =>
							isFilterActive(value)
								? updateSearchParams('max_price', null)
								: updateSearchParams('max_price', value)
						}
						type="button"
					>
						{label}
					</button>
				))}
			</div>

			{/* Custom range */}
			<div className="pt-3 border-t border-gray-100">
				<p className="text-xs text-gray-500 mb-2 font-medium">
					Custom range
				</p>
				<div className="flex items-center gap-2">
					<div className="relative flex-1">
						<span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
							{symbol}
						</span>
						<input
							className="w-full pl-5 pr-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#372248] bg-white"
							onChange={(e) => {
								if (/^\d*$/.test(e.target.value))
									setMin(e.target.value);
							}}
							placeholder="Min"
							value={min}
						/>
					</div>
					<Minus className="text-gray-300 shrink-0" />
					<div className="relative flex-1">
						<span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
							{symbol}
						</span>
						<input
							className="w-full pl-5 pr-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#372248] bg-white"
							onChange={(e) => {
								if (/^\d*$/.test(e.target.value))
									setMax(e.target.value);
							}}
							placeholder="Max"
							value={max}
						/>
					</div>
				</div>
				<button
					className="mt-2 w-full py-2 rounded-lg bg-[#372248] text-white text-sm font-medium hover:bg-[#4a2d60] transition-colors disabled:opacity-50"
					disabled={!min && !max}
					onClick={() => {
						updateSearchParams('min_price', min || null);
						updateSearchParams('max_price', max || null);
					}}
					type="button"
				>
					Apply
				</button>
			</div>
		</FilterSection>
	);
}

// ─── Condition filter ────────────────────────────────────────────────────────

function ConditionFilter({ defaultOpen = true }: { defaultOpen?: boolean }) {
	const { items } = useRefinementList({
		attribute: 'variants.condition',
		limit: 20,
		operator: 'or',
	});
	const { updateFilters, isFilterActive, filters, clearAllFilters } =
		useFilters('condition');

	const CONDITION_ICONS: Record<string, string> = {
		new: '✨',
		used: '🔄',
		refurbished: '🔧',
	};

	return (
		<FilterSection
			activeCount={filters.length}
			defaultOpen={defaultOpen}
			onClear={clearAllFilters}
			title="Condition"
		>
			<div className="space-y-2">
				{items.map(({ label, count }) => (
					<button
						className={cn(
							'w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all',
							isFilterActive(label)
								? 'bg-[#372248] text-white border-[#372248] font-medium'
								: 'bg-gray-50 text-gray-700 border-gray-200 hover:border-[#372248] hover:bg-purple-50',
							!count && 'opacity-40 cursor-not-allowed',
						)}
						disabled={!count}
						key={label}
						onClick={() => count && updateFilters(label)}
						type="button"
					>
						<span className="flex items-center gap-2">
							<span>
								{CONDITION_ICONS[label.toLowerCase()] ?? '•'}
							</span>
							<span className="capitalize">{label}</span>
						</span>
						<span
							className={cn(
								'text-xs font-semibold rounded-full px-1.5 py-0.5',
								isFilterActive(label)
									? 'bg-white/20 text-white'
									: 'bg-gray-200 text-gray-600',
							)}
						>
							{count}
						</span>
					</button>
				))}
			</div>
		</FilterSection>
	);
}

// ─── Size filter ─────────────────────────────────────────────────────────────

function SizeFilter({ defaultOpen = true }: { defaultOpen?: boolean }) {
	const { items } = useRefinementList({
		attribute: 'variants.size',
		limit: 100,
		operator: 'or',
	});
	const { updateFilters, isFilterActive, filters, clearAllFilters } =
		useFilters('size');

	const sorted = [...items].sort(
		(a, b) => Number(a.label) - Number(b.label),
	);

	return (
		<FilterSection
			activeCount={filters.length}
			defaultOpen={defaultOpen}
			onClear={clearAllFilters}
			title="Size"
		>
			<div className="flex flex-wrap gap-2">
				{sorted.map(({ label, count }) => (
					<button
						className={cn(
							'px-3 py-1.5 rounded-lg border text-sm font-medium transition-all',
							isFilterActive(label)
								? 'bg-[#372248] text-white border-[#372248] shadow-sm'
								: 'bg-white text-gray-700 border-gray-200 hover:border-[#372248] hover:text-[#372248]',
							!count && 'opacity-40 cursor-not-allowed',
						)}
						disabled={!count}
						key={label}
						onClick={() => count && updateFilters(label)}
						type="button"
					>
						{label}
					</button>
				))}
			</div>
		</FilterSection>
	);
}

// ─── Color filter ─────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
	black: '#000000',
	white: '#FFFFFF',
	red: '#EF4444',
	blue: '#3B82F6',
	green: '#22C55E',
	yellow: '#EAB308',
	orange: '#F97316',
	purple: '#A855F7',
	pink: '#EC4899',
	gray: '#6B7280',
	grey: '#6B7280',
	brown: '#92400E',
	navy: '#1E3A5F',
	beige: '#F5F0E8',
	gold: '#D97706',
	silver: '#9CA3AF',
};

function ColorFilter({ defaultOpen = true }: { defaultOpen?: boolean }) {
	const { items } = useRefinementList({
		attribute: 'variants.color',
		escapeFacetValues: false,
		limit: 100,
		operator: 'and',
		sortBy: ['isRefined', 'count', 'name'],
	});
	const { updateFilters, isFilterActive, filters, clearAllFilters } =
		useFilters('color');

	return (
		<FilterSection
			activeCount={filters.length}
			defaultOpen={defaultOpen}
			onClear={clearAllFilters}
			title="Color"
		>
			<div className="flex flex-wrap gap-3">
				{items.map(({ label, count }) => {
					const hex =
						COLOR_MAP[label.toLowerCase()] ?? label.toLowerCase();
					const active = isFilterActive(label.toLowerCase());
					const isLight =
						['white', 'beige', 'yellow', 'silver'].includes(
							label.toLowerCase(),
						);

					return (
						<button
							className={cn(
								'group relative flex flex-col items-center gap-1 transition-transform',
								!count && 'opacity-40 cursor-not-allowed',
							)}
							disabled={!count}
							key={label}
							onClick={() =>
								count && updateFilters(label.toLowerCase())
							}
							title={label}
							type="button"
						>
							<div
								className={cn(
									'w-8 h-8 rounded-full border-2 transition-all',
									active
										? 'border-[#372248] scale-110 shadow-lg'
										: 'border-gray-200 group-hover:border-[#372248] group-hover:scale-105',
									isLight && 'border-gray-300',
								)}
								style={{ backgroundColor: hex }}
							>
								{active && (
									<div className="w-full h-full rounded-full flex items-center justify-center">
										<svg
											className={cn(
												'w-3 h-3',
												isLight
													? 'text-gray-800'
													: 'text-white',
											)}
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												clipRule="evenodd"
												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
												fillRule="evenodd"
											/>
										</svg>
									</div>
								)}
							</div>
							<span
								className={cn(
									'text-[10px] font-medium capitalize leading-none',
									active
										? 'text-[#372248]'
										: 'text-gray-500',
								)}
							>
								{label.length > 7
									? `${label.slice(0, 6)}…`
									: label}
							</span>
						</button>
					);
				})}
			</div>
		</FilterSection>
	);
}

// ─── Rating filter ────────────────────────────────────────────────────────────

const ratingOptions = [
	{ label: '4', display: '4 stars & up' },
	{ label: '3', display: '3 stars & up' },
	{ label: '2', display: '2 stars & up' },
];

function RatingFilter({ defaultOpen = true }: { defaultOpen?: boolean }) {
	const { updateFilters, isFilterActive, filters, clearAllFilters } =
		useFilters('rating');

	return (
		<FilterSection
			activeCount={filters.length}
			defaultOpen={defaultOpen}
			onClear={clearAllFilters}
			title="Rating"
		>
			<div className="space-y-2">
				{ratingOptions.map(({ label, display }) => (
					<button
						className={cn(
							'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all',
							isFilterActive(label)
								? 'bg-[#372248] border-[#372248]'
								: 'bg-gray-50 border-gray-200 hover:border-[#372248] hover:bg-purple-50',
						)}
						key={label}
						onClick={() => updateFilters(label)}
						type="button"
					>
						<div className="flex gap-0.5">
							{Array.from({ length: 5 }).map((_, i) => (
								<svg
									className={cn(
										'w-3.5 h-3.5',
										i < Number(label)
											? isFilterActive(label)
												? 'text-yellow-300'
												: 'text-yellow-400'
											: isFilterActive(label)
												? 'text-white/30'
												: 'text-gray-300',
									)}
									fill="currentColor"
									key={i}
									viewBox="0 0 20 20"
								>
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
								</svg>
							))}
						</div>
						<span
							className={cn(
								'text-sm font-medium',
								isFilterActive(label)
									? 'text-white'
									: 'text-gray-700',
							)}
						>
							{display}
						</span>
					</button>
				))}
			</div>
		</FilterSection>
	);
}
