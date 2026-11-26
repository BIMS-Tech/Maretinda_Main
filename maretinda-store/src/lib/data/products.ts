'use server';

import type { HttpTypes } from '@medusajs/types';

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
			next: { revalidate: 30 },
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
