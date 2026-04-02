'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { SearchIcon2 } from '@/icons';
import { client } from '@/lib/client';

type Category = {
	id: string;
	name: string;
	handle: string;
};

type AlgoliaHit = {
	objectID: string;
	title: string;
	thumbnail?: string;
	handle?: string;
	variants?: { prices?: { amount: number; currency_code: string }[] }[];
};

export const NavbarSearch = ({
	categories = [],
}: {
	categories?: Category[];
}) => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState(searchParams.get('query') || '');
	const [selectedCategory, setSelectedCategory] = useState('all');
	const [productHits, setProductHits] = useState<AlgoliaHit[]>([]);
	const [loading, setLoading] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const formRef = useRef<HTMLFormElement>(null);

	// Debounced Algolia search
	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);

		if (!search.trim()) {
			setProductHits([]);
			return;
		}

		debounceRef.current = setTimeout(async () => {
			setLoading(true);
			try {
				const response = await client.search({
					requests: [
						{
							indexName: 'products',
							query: search.trim(),
							hitsPerPage: 5,
							attributesToRetrieve: [
								'title',
								'thumbnail',
								'handle',
								'variants',
							],
							filters: 'NOT seller.store_status:SUSPENDED',
						},
					],
				});
				const result = response.results?.[0];
				if (result && 'hits' in result) {
					setProductHits(result.hits as AlgoliaHit[]);
				}
			} catch {
				setProductHits([]);
			} finally {
				setLoading(false);
			}
		}, 300);
	}, [search]);

	const matchingCategories = search.trim()
		? categories.filter((cat) =>
				cat.name.toLowerCase().includes(search.toLowerCase()),
			)
		: categories.slice(0, 6);

	const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setOpen(false);
		const query = search.trim();
		if (selectedCategory && selectedCategory !== 'all') {
			router.push(
				`/categories/${selectedCategory}${query ? `?query=${encodeURIComponent(query)}` : ''}`,
			);
		} else if (query) {
			router.push(`/categories?query=${encodeURIComponent(query)}`);
		} else {
			router.push('/categories');
		}
	};

	const handleProductClick = (e: React.MouseEvent, href: string) => {
		e.preventDefault();
		setOpen(false);
		setSearch('');
		router.push(href);
	};

	const getLowestPrice = (hit: AlgoliaHit): string => {
		const prices =
			hit.variants?.flatMap((v) => v.prices ?? []).filter(Boolean) ?? [];
		if (!prices.length) return '';
		const lowest = Math.min(...prices.map((p) => p.amount));
		const currency = prices[0]?.currency_code?.toUpperCase() ?? '';
		return `${currency} ${(lowest / 100).toLocaleString()}`;
	};

	return (
		<form
			className="flex items-center w-full relative"
			onSubmit={submitHandler}
			ref={formRef}
		>
			{/* Search input */}
			<div className="relative w-full">
				<button
					className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
					type="submit"
				>
					<SearchIcon2 color="#372248" />
				</button>

				{/* Category selector */}
				<select
					className="absolute left-10 top-1/2 -translate-y-1/2 z-10 text-sm font-medium text-gray-600 bg-transparent border-r border-gray-200 pr-2 mr-1 focus:outline-none cursor-pointer max-w-[110px]"
					onChange={(e) => setSelectedCategory(e.target.value)}
					value={selectedCategory}
				>
					<option value="all">All</option>
					{categories.map((cat) => (
						<option key={cat.id} value={cat.handle}>
							{cat.name}
						</option>
					))}
				</select>

				<input
					className="text-base bg-white rounded-[62px] w-full border-0 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.1)] pl-[180px] pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#372248]/20"
					onBlur={() =>
						setTimeout(() => setOpen(false), 200)
					}
					onChange={(e) => setSearch(e.target.value)}
					onFocus={() => setOpen(true)}
					placeholder="Search for products..."
					type="text"
					value={search}
				/>

				{search && (
					<button
						className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
						onClick={() => setSearch('')}
						type="button"
					>
						<svg
							className="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								d="M6 18L18 6M6 6l12 12"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
							/>
						</svg>
					</button>
				)}
			</div>

			{/* Dropdown */}
			{open && (
				<div className="absolute top-full mt-2 w-full bg-white z-50 rounded-2xl shadow-[0px_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden">

					{/* Product suggestions */}
					{search.trim() && (
						<div className="p-3 border-b border-gray-50">
							<p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
								{loading ? 'Searching…' : 'Products'}
							</p>
							{loading && (
								<div className="flex gap-2 px-2 py-2">
									{[1, 2, 3].map((i) => (
										<div
											className="h-8 bg-gray-100 rounded animate-pulse flex-1"
											key={i}
										/>
									))}
								</div>
							)}
							{!loading && productHits.length === 0 && (
								<p className="text-sm text-gray-400 px-2 py-1">
									No products found for &ldquo;{search}&rdquo;
								</p>
							)}
							{!loading &&
								productHits.map((hit) => (
									<LocalizedClientLink
										className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors group"
										href={`/products/${hit.handle ?? hit.objectID}`}
										key={hit.objectID}
										onMouseDown={(e: React.MouseEvent) => handleProductClick(e, `/products/${hit.handle ?? hit.objectID}`)}
									>
										<div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
											{hit.thumbnail ? (
												<Image
													alt={hit.title}
													className="w-full h-full object-cover"
													height={40}
													src={hit.thumbnail}
													width={40}
												/>
											) : (
												<div className="w-full h-full flex items-center justify-center text-gray-300">
													<svg
														className="w-5 h-5"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={1.5}
														/>
													</svg>
												</div>
											)}
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-gray-800 truncate group-hover:text-[#372248]">
												{hit.title}
											</p>
											{getLowestPrice(hit) && (
												<p className="text-xs text-gray-500">
													from{' '}
													{getLowestPrice(hit)}
												</p>
											)}
										</div>
										<svg
											className="w-4 h-4 text-gray-300 group-hover:text-[#372248] shrink-0"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												d="M9 5l7 7-7 7"
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
											/>
										</svg>
									</LocalizedClientLink>
								))}

							{!loading && productHits.length > 0 && (
								<button
									className="w-full mt-1 py-2 text-xs font-semibold text-[#372248] hover:bg-purple-50 rounded-lg transition-colors"
									onMouseDown={() => {
										setOpen(false);
										router.push(
											`/categories?query=${encodeURIComponent(search)}`,
										);
									}}
									type="button"
								>
									See all results for &ldquo;{search}&rdquo; →
								</button>
							)}
						</div>
					)}

					{/* Category suggestions */}
					<div className="p-3">
						<p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
							{search.trim()
								? 'Matching Categories'
								: 'Browse Categories'}
						</p>
						{matchingCategories.length === 0 ? (
							<p className="text-sm text-gray-400 px-2 py-1">
								No categories found
							</p>
						) : (
							<div className="grid grid-cols-2 gap-1">
								{matchingCategories.map((cat) => (
									<LocalizedClientLink
										className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#372248] transition-colors"
										href={`/categories/${cat.handle.trim()}`}
										key={cat.id}
										onMouseDown={(e: React.MouseEvent) => handleProductClick(e, `/categories/${cat.handle.trim()}`)}
									>
										<svg
											className="w-3.5 h-3.5 text-gray-400 shrink-0"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={1.5}
											/>
										</svg>
										{cat.name}
									</LocalizedClientLink>
								))}
							</div>
						)}
					</div>
				</div>
			)}
		</form>
	);
};
