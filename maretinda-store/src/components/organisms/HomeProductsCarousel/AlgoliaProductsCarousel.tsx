'use client';

import type { HttpTypes } from '@medusajs/types';
import { useEffect, useState } from 'react';
import { Configure, useHits } from 'react-instantsearch';
import { InstantSearchNext } from 'react-instantsearch-nextjs';

import { Carousel } from '@/components/cells';
import { client } from '@/lib/client';
import { listProducts } from '@/lib/data/products';
import { getProductPrice } from '@/lib/helpers/get-product-price';
import type { Wishlist } from '@/types/wishlist';

import { ProductCard } from '../ProductCard/ProductCard';

export const AlgoliaProductsCarousel = ({
	locale,
	seller_handle,
	currency_code,
	user,
	wishlist,
}: {
	locale: string;
	seller_handle?: string;
	currency_code: string;
	user: HttpTypes.StoreCustomer | null;
	wishlist: Wishlist[];
}) => {
	const filters = `${
		seller_handle
			? `NOT seller:null AND seller.handle:${seller_handle} AND `
			: 'NOT seller:null AND '
	}NOT seller.store_status:SUSPENDED AND supported_countries:${locale} AND variants.prices.currency_code:${currency_code}`;

	return (
		<InstantSearchNext indexName="products" searchClient={client}>
			<Configure filters={filters} hitsPerPage={4} />
			<ProductsListing locale={locale} user={user} wishlist={wishlist} />
		</InstantSearchNext>
	);
};

const ProductsListing = ({
	locale,
	user,
	wishlist,
}: {
	locale: string;
	user: HttpTypes.StoreCustomer | null;
	wishlist: Wishlist[];
}) => {
	const [prod, setProd] = useState<HttpTypes.StoreProduct[] | null>(null);
	const { items } = useHits();

	useEffect(() => {
		listProducts({
			countryCode: locale,
			queryParams: {
				fields: '*variants.calculated_price,+variants.inventory_quantity,*seller.reviews,-thumbnail,-images,-type,-tags,-variants.options,-options,-collection,-collection_id',
				limit: 99999,
			},
		}).then(({ response }) => {
			setProd(response.products);
		});
	}, []);

	return (
		<>
			<div className="flex justify-between w-full items-center"></div>
			<div className="w-full ">
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
						<Carousel
							align="start"
							items={items.map((hit) => (
								<ProductCard
									api_product={prod?.find((p) => {
										const { cheapestPrice } =
											getProductPrice({
												product: p,
											});
										return (
											p.id === hit.objectID &&
											Boolean(cheapestPrice) &&
											p
										);
									})}
									key={hit.objectID}
									product={hit}
									user={user}
									wishlist={wishlist}
								/>
							))}
						/>
					</div>
				)}
			</div>
		</>
	);
};
