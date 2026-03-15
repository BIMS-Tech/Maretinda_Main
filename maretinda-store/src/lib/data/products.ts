'use server';

import type { HttpTypes } from '@medusajs/types';

import { sortProducts } from '@/lib/helpers/sort-products';
import type { SortOptions } from '@/types/product';
import type { SellerProps } from '@/types/seller';

import { sdk } from '../config';
import { getAuthHeaders } from './cookies';
import { getRegion, retrieveRegion } from './regions';

export const listProducts = async ({
	pageParam = 1,
	queryParams,
	countryCode,
	regionId,
	category_id,
	collection_id,
}: {
	pageParam?: number;
	queryParams?: HttpTypes.FindParams &
		HttpTypes.StoreProductParams & {
			handle?: string;
		};
	category_id?: string;
	collection_id?: string;
	countryCode?: string;
	regionId?: string;
}): Promise<{
	response: {
		products: (HttpTypes.StoreProduct & { seller?: SellerProps })[];
		count: number;
	};
	nextPage: number | null;
	queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams;
}> => {
	if (!countryCode && !regionId) {
		throw new Error('Country code or region ID is required');
	}

	const limit = queryParams?.limit || 12;
	const _pageParam = Math.max(pageParam, 1);
	const offset = (_pageParam - 1) * limit;

	let region: HttpTypes.StoreRegion | undefined | null;

	if (countryCode) {
		region = await getRegion(countryCode);
	} else {
		region = await retrieveRegion(regionId!);
	}

	if (!region) {
		return {
			nextPage: null,
			response: { count: 0, products: [] },
		};
	}

	const headers = {
		...(await getAuthHeaders()),
	};

	return sdk.client
		.fetch<{
			products: (HttpTypes.StoreProduct & { seller?: SellerProps })[];
			count: number;
		}>(`/store/products`, {
			cache: 'no-cache',
			headers,
			method: 'GET',
			query: {
				country_code: countryCode,
				category_id,
				collection_id,
				region_id: region?.id,
				fields: '*variants.calculated_price,+variants.inventory_quantity,*variants,*attribute_values,*attribute_values.attribute',
				limit,
				offset,
				...queryParams,
			},
		})
		.then(({ products: productsRaw, count }) => {
			// Since we're not fetching seller data directly due to SQL issues,
			// we'll return products without seller filtering for now
			// TODO: Implement separate seller data fetching if needed
			const products = productsRaw;

			const nextPage = count > offset + limit ? pageParam + 1 : null;

			return {
				nextPage: nextPage,
				queryParams,
				response: {
					count,
					products,
				},
			};
		});
};

/**
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const listProductsWithSort = async ({
	page = 1,
	queryParams,
	sortBy = 'created_at',
	countryCode,
	category_id,
	seller_id,
	collection_id,
}: {
	page?: number;
	queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams;
	sortBy?: SortOptions;
	countryCode: string;
	category_id?: string;
	seller_id?: string;
	collection_id?: string;
}): Promise<{
	response: {
		products: HttpTypes.StoreProduct[];
		count: number;
	};
	nextPage: number | null;
	queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams;
}> => {
	const limit = queryParams?.limit || 12;

	const {
		response: { products, count },
	} = await listProducts({
		category_id,
		collection_id,
		countryCode,
		pageParam: 0,
		queryParams: {
			...queryParams,
			limit: 100,
		},
	});

	const filteredProducts = seller_id
		? products.filter((product) => product.seller?.id === seller_id)
		: products;

	const pricedProducts = filteredProducts.filter((prod) =>
		prod.variants?.some((variant) => variant.calculated_price !== null),
	);

	const sortedProducts = sortProducts(pricedProducts, sortBy);

	const pageParam = (page - 1) * limit;

	const nextPage = count > pageParam + limit ? pageParam + limit : null;

	const paginatedProducts = sortedProducts.slice(
		pageParam,
		pageParam + limit,
	);

	return {
		nextPage,
		queryParams,
		response: {
			count,
			products: paginatedProducts,
		},
	};
};
