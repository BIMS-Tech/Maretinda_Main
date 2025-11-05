'use client';

import { Funnel } from '@medusajs/icons';
import type { HttpTypes } from '@medusajs/types';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BsGrid3X2Gap } from 'react-icons/bs';
import { TiThListOutline } from 'react-icons/ti';
import { Configure, useHits } from 'react-instantsearch';
import { InstantSearchNext } from 'react-instantsearch-nextjs';

import { SelectField, TabsContent, TabsList } from '@/components/molecules';
import {
	AlgoliaProductSidebar,
	ProductCard,
	ProductListingActiveFilters,
	ProductsPagination,
} from '@/components/organisms';
import { ProductBigCard } from '@/components/organisms/ProductCard/ProductBigCard';
import { ProductListingSkeleton } from '@/components/organisms/ProductListingSkeleton/ProductListingSkeleton';
import { PRODUCT_LIMIT, PRODUCT_LIMIT_BIG_CARD } from '@/const';
import { client } from '@/lib/client';
import { listProducts } from '@/lib/data/products';
import { getFacedFilters } from '@/lib/helpers/get-faced-filters';
import { getProductPrice } from '@/lib/helpers/get-product-price';
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
	const [activeTab, setActiveTab] = useState('card');
	const [offset, setOffset] = useState(
		activeTab === 'card' ? PRODUCT_LIMIT : PRODUCT_LIMIT_BIG_CARD,
	);
	const { items, results } = useHits();

	const [pageLimit, setPageLimit] = useState(offset);

	const searchParamas = useSearchParams();

	useEffect(() => {
		if (activeTab === 'card') {
			setPageLimit(PRODUCT_LIMIT);
			setOffset(PRODUCT_LIMIT);
		}

		if (activeTab === 'list') {
			setPageLimit(PRODUCT_LIMIT_BIG_CARD);
			setOffset(PRODUCT_LIMIT_BIG_CARD);
		}
	}, [activeTab]);

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

	if (!results?.processingTimeMS) return <ProductListingSkeleton />;

	const page: number = +(searchParamas.get('page') || 1);
	const filteredProducts = items.filter((pr) =>
		prod?.some((p: any) => p.id === pr.objectID),
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

	const tabsList = [
		{
			children: (
				<button
					className="w-[45px] pb-[18px] flex items-center justify-center"
					onClick={() => setActiveTab('card')}
					type="button"
				>
					<BsGrid3X2Gap size={27} />
				</button>
			),
			label: 'Card',
		},
		{
			children: (
				<button
					className="w-[45px] pb-[18px] flex items-center justify-center"
					onClick={() => setActiveTab('list')}
					type="button"
				>
					<TiThListOutline size={24} />
				</button>
			),
			label: 'List',
		},
	];

	return (
		<>
			<div className="text-[#999] font-medium text-[20px] flex justify-between w-full border-b-[1px] border-[#00000021] mb-12">
				<div className="flex gap-[7px] items-center pb-[18px] ">
					<Funnel height={18} width={18} /> Filter
				</div>
				<div>{`${count} results`}</div>
				<div className="flex items-center pb-[18px] ">
					<span className="text-nowrap">Sort by: </span>
					<SelectField
						className="ml-1 text-black bg-transparent border-none !font-medium !text-[20px] !p-0 !h-auto w-[180px]"
						options={sortByDropdownOptions}
					/>
				</div>
				<div className="h-full flex">
					<TabsList activeTab={activeTab} list={tabsList} />
				</div>
			</div>

			<div className="md:flex gap-4">
				<div className="w-[280px] shrink-0">
					<div className="hidden md:block">
						<ProductListingActiveFilters />
					</div>
					<AlgoliaProductSidebar />
				</div>
				<div className="w-full">
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
						<div className="w-full">
							<ul className={'flex flex-wrap gap-2'}>
								<TabsContent activeTab={activeTab} value="card">
									{products.map(
										(hit) =>
											prod?.find(
												(p: any) =>
													p.id === hit.objectID,
											) && (
												<ProductCard
													api_product={prod?.find(
														(p: any) =>
															p.id ===
															hit.objectID,
													)}
													key={hit.objectID}
													product={hit}
													user={user}
													wishlist={wishlist}
												/>
											),
									)}
								</TabsContent>

								<TabsContent activeTab={activeTab} value="list">
									{products.map(
										(hit, index) =>
											prod?.find(
												(p: any) =>
													p.id === hit.objectID,
											) && (
												<ProductBigCard
													api_product={prod?.find(
														(p: any) =>
															p.id ===
															hit.objectID,
													)}
													id={index}
													key={hit.objectID}
													product={hit}
													user={user}
													wishlist={wishlist}
												/>
											),
									)}
								</TabsContent>
							</ul>
						</div>
					)}
					{pageLimit < filteredProducts.length && (
						<ProductsPagination
							isInfinite
							offset={offset}
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
