'use client';

import { Funnel } from '@medusajs/icons';
import type { HttpTypes } from '@medusajs/types';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BsSliders } from 'react-icons/bs';
import { MdOutlineClose } from 'react-icons/md';
import { Configure, useHits } from 'react-instantsearch';
import { InstantSearchNext } from 'react-instantsearch-nextjs';

import { Button } from '@/components/atoms';
import { SelectField } from '@/components/molecules';
import {
	AlgoliaProductSidebar,
	ProductCard,
	ProductsPagination,
} from '@/components/organisms';
import { ProductBigCard } from '@/components/organisms/ProductCard/ProductBigCard';
import { ProductListingSkeleton } from '@/components/organisms/ProductListingSkeleton/ProductListingSkeleton';
import { PRODUCT_LIMIT, PRODUCT_LIMIT_BIG_CARD } from '@/const';
import { CardViewIcon, ListViewIcon } from '@/icons';
import { client } from '@/lib/client';
import { listProducts } from '@/lib/data/products';
import { getFacedFilters } from '@/lib/helpers/get-faced-filters';
import { getProductPrice } from '@/lib/helpers/get-product-price';
import { cn } from '@/lib/utils';
import type { Wishlist } from '@/types/wishlist';

export const AlgoliaProductsListing = ({
	category_id,
	collection_id,
	seller_handle,
	locale = process.env.NEXT_PUBLIC_DEFAULT_REGION,
	currency_code,
	user = null,
	wishlist = [],
}: {
	category_id?: string;
	collection_id?: string;
	locale?: string;
	seller_handle?: string;
	currency_code?: string;
	user?: HttpTypes.StoreCustomer | null;
	wishlist?: Wishlist[] | [];
}) => {
	const searchParamas = useSearchParams();

	const facetFilters: string = getFacedFilters(searchParamas);
	const query: string = searchParamas.get('query') || '';

	const filters = `${
		seller_handle
			? `NOT seller:null AND seller.handle:${seller_handle} AND `
			: 'NOT seller:null AND '
	}NOT seller.store_status:SUSPENDED AND supported_countries:${locale}${
		category_id
			? ` AND categories.id:${category_id}${
					collection_id !== undefined
						? ` AND collections.id:${collection_id}`
						: ''
				} ${facetFilters}`
			: ` ${facetFilters}`
	}`;

	return (
		<InstantSearchNext indexName="products" searchClient={client}>
			<Configure filters={filters} query={query} />
			<ProductsListing locale={locale} user={user} wishlist={wishlist} />
		</InstantSearchNext>
	);
};

const ProductsListing = ({
	// TODO: remove this in favor of layout toggle in product listing
	// once the layout toggle is implemented.
	locale,
	user,
	wishlist,
}: {
	locale?: string;
	user: HttpTypes.StoreCustomer | null;
	wishlist: Wishlist[] | [];
}) => {
	const [prod, setProd] = useState<HttpTypes.StoreProduct[] | null>(null);
	const [selectedSort, setSelectedSort] = useState('Default');
	const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
	const { items, results } = useHits();
	const [isToggleActive, setIsToggleActive] = useState(true);
	const layoutLimit = isToggleActive ? PRODUCT_LIMIT_BIG_CARD : PRODUCT_LIMIT;
	const [pageLimit, setPageLimit] = useState(layoutLimit);

	const searchParamas = useSearchParams();

	useEffect(() => {
		listProducts({
			countryCode: locale,
			queryParams: {
				fields: '*variants.calculated_price,+variants.inventory_quantity,*seller.reviews,+seller.name,+seller.photo,-thumbnail,-images,-type,-tags,-variants.options,-options,-collection,-collection_id',
			},
		}).then(({ response }) => {
			setProd(
				response.products.filter((prod) => {
					const { cheapestPrice } = getProductPrice({
						product: prod,
					});
					return Boolean(cheapestPrice) && prod;
				}),
			);
		});
	}, [locale]);

	useEffect(() => {
		if (isFilterModalOpen) {
			// Save current scroll position
			const scrollY = window.scrollY;
			document.body.style.position = 'fixed';
			document.body.style.top = `-${scrollY}px`;
			document.body.style.left = '0';
			document.body.style.right = '0';
			document.body.style.width = '100%';

			return () => {
				// Unlock scroll
				document.body.style.position = '';
				document.body.style.top = '';
				document.body.style.left = '';
				document.body.style.right = '';
				document.body.style.width = '';

				window.scrollTo(0, scrollY);
			};
		}
	}, [isFilterModalOpen]);

	if (!results?.processingTimeMS) return <ProductListingSkeleton />;

	const page: number = +(searchParamas.get('page') || 1);
	const filteredProducts = items.filter((pr) =>
		prod?.some((p: HttpTypes.StoreProduct) => p.id === pr.objectID),
	);
	const products = filteredProducts.slice(
		(page - 1) * pageLimit,
		page * pageLimit,
	);

	const count = prod?.length || 0;
	// const pages = Math.ceil(count / pageLimit) || 1;

	const sortByDropdownOptions = [
		{ label: 'Default', value: 'Default' },
		{ label: 'Popularity', value: 'Popularity' },
		{ label: 'Average rating', value: 'Average rating' },
		{ label: 'Price: low to high', value: 'Price: low to high' },
		{ label: 'Price: high to low', value: 'Price: high to low' },
	];

	return (
		<>
			<div className="text-[#999] font-medium text-[20px] grid grid-cols-2 grid-rows-2 gap-y-6 gap-x-[20px] md:grid-flow-col md:grid-cols-none md:grid-rows-1 justify-between w-full border-b-[1px] border-[#00000021] mb-12">
				<div className="md:hidden order-1">
					<Button
						className="w-full bg-white rounded-[5px] border-black flex justify-center items-center py-[15px] gap-[10px] font-poppins font-medium text-base border-[1px]"
						onClick={() => setIsFilterModalOpen(true)}
					>
						<BsSliders size={24} />
						Filter
					</Button>
				</div>
				<div className="hidden md:flex order-1 gap-[7px] items-center pb-[18px] ">
					<Funnel height={18} width={18} /> Filter
				</div>
				<div className="order-3 md:order-2">{`${count} of ${count} results`}</div>
				<div className="order-2 md:order-3 text-[16px] md:text-[20px] flex items-center rounded-[5px] pl-[10px] md:p-0 md:pb-[18px] border-black border-[1px] md:border-none">
					<span className="text-nowrap">Sort by: </span>
					<SelectField
						className="ml-2 text-black bg-transparent border-none !font-medium !text-[16px] md:!text-[20px] !p-0 !h-auto md:min-w-[192px]"
						full
						options={sortByDropdownOptions}
					/>
				</div>
				<div className="order-4 h-full flex justify-end">
					<Button
						className={cn(
							`toggleIcon ${isToggleActive && 'border-b-[3px]'}`,
						)}
						onClick={() => setIsToggleActive(true)}
					>
						<CardViewIcon size={27} />
					</Button>
					<Button
						className={cn(
							`toggleIcon ${!isToggleActive && 'border-b-[3px]'}`,
						)}
						onClick={() => setIsToggleActive(false)}
					>
						<ListViewIcon size={27} />
					</Button>
				</div>
			</div>

			<div className="md:flex gap-4">
				<div className="w-[280px] shrink-0">
					<div className="hidden md:block">
						<AlgoliaProductSidebar />
					</div>
					<div className="md:hidden">
						{/** biome-ignore lint/a11y/noStaticElementInteractions: Not necessary for modal background */}
						{/** biome-ignore lint/a11y/noNoninteractiveElementInteractions: Not necessary for modal background */}
						{/** biome-ignore lint/a11y/useKeyWithClickEvents: Use close button instead */}
						<div
							className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-300 ${
								isFilterModalOpen
									? 'opacity-100 visible'
									: 'opacity-0 invisible'
							}`}
							onClick={() => setIsFilterModalOpen(false)}
						/>
						<div
							className={`fixed top-0 left-0 py-8 px-6 max-w-[336px] h-[90vh] overflow-y-auto bg-white shadow-xl z-50 transform transition-transform duration-300 ${
								isFilterModalOpen
									? 'translate-x-0'
									: '-translate-x-full'
							}`}
						>
							<div className="flex justify-between border-b-[1px] pb-6 mb-2">
								<h2 className="font-semibold text-[21px]">
									Filter & Sort
								</h2>
								<MdOutlineClose
									onClick={() => setIsFilterModalOpen(false)}
									size={27}
								/>
							</div>
							<AlgoliaProductSidebar isModal />
						</div>
					</div>
				</div>
				<div className="w-full max-w-[952px]">
					{!items.length ? (
						<div className="text-center w-full my-10">
							<h2 className="uppercase text-primary heading-lg">
								no results
							</h2>
							<p className="mt-4 text-lg">
								Sorry, we can&apos;t find any results for your
								criteria
							</p>
						</div>
					) : (
						<div className="w-[calc(100%+32px)] -mx-4 sm:mx-auto sm:w-full">
							<ul
								className={cn(
									'flex flex-wrap gap-2',
									isToggleActive && 'flex-row',
								)}
							>
								{products.map(
									(hit, index) =>
										prod?.find(
											(p: any) => p.id === hit.objectID,
										) &&
										(!isToggleActive ? (
											<ProductBigCard
												api_product={prod?.find(
													(p: any) =>
														p.id === hit.objectID,
												)}
												id={index}
												key={hit.objectID}
												product={hit}
												user={user}
												wishlist={wishlist}
											/>
										) : (
											<ProductCard
												api_product={prod?.find(
													(p: any) =>
														p.id === hit.objectID,
												)}
												key={hit.objectID}
												product={hit}
												user={user}
												wishlist={wishlist}
											/>
										)),
								)}
							</ul>
						</div>
					)}
					{pageLimit < filteredProducts.length && (
						<ProductsPagination
							isInfinite
							offset={layoutLimit}
							pageLimit={pageLimit}
							// pages={pages}
							setPageLimit={setPageLimit}
						/>
					)}
				</div>
			</div>
		</>
	);
};
