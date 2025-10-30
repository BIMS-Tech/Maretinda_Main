'use client';

import type { HttpTypes } from '@medusajs/types';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Configure, useHits } from 'react-instantsearch';
import { InstantSearchNext } from 'react-instantsearch-nextjs';

import {
	AlgoliaProductSidebar,
	ProductCard,
	ProductListingActiveFilters,
	ProductsPagination,
} from '@/components/organisms';
import { ProductListingSkeleton } from '@/components/organisms/ProductListingSkeleton/ProductListingSkeleton';
import { PRODUCT_LIMIT } from '@/const';
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
	const { items, results } = useHits();

	const [pageLimit, setPageLimit] = useState(PRODUCT_LIMIT);

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
	}, []);

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

	return (
		<>
			<div className="flex justify-between w-full items-center">
				<div className="my-4 label-md">{`${count} listings`}</div>
			</div>
			<div className="hidden md:block w-[280px]">
				<ProductListingActiveFilters />
			</div>
			<div className="md:flex gap-4">
				<div className="max-w-[280px]">
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
								{products.map(
									(hit) =>
										prod?.find(
											(p: any) => p.id === hit.objectID,
										) && (
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
										),
								)}
							</ul>
						</div>
					)}
					{pageLimit < filteredProducts.length && (
						<ProductsPagination
							isInfinite
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
