'use server';

import type { HttpTypes } from '@medusajs/types';

import medusaError from '@/lib/helpers/medusa-error';

import { sdk } from '../config';
import { getCacheOptions } from './cookies';

export const listRegions = async () => {
	const next = {
		...(await getCacheOptions('regions')),
	};

	return sdk.client
		.fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
			cache: 'no-cache',
			method: 'GET',
			next,
		})
		.then(({ regions }) => regions)
		.catch(medusaError);
};

export const retrieveRegion = async (id: string) => {
	const next = {
		...(await getCacheOptions(['regions', id].join('-'))),
	};

	return sdk.client
		.fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
			cache: 'no-cache',
			method: 'GET',
			next,
		})
		.then(({ region }) => region)
		.catch(medusaError);
};

const regionMap = new Map<string, HttpTypes.StoreRegion>();

export const getRegion = async (countryCode: string) => {
	try {
		if (regionMap.has(countryCode)) {
			return regionMap.get(countryCode);
		}

		const regions = await listRegions();

		if (!regions) {
			return null;
		}

		regions.forEach((region) => {
			region.countries?.forEach((c) => {
				regionMap.set(c?.iso_2 ?? '', region);
			});
		});

		const region = countryCode
			? regionMap.get(countryCode)
			: regionMap.get('ph');

		return region;
	} catch (e: any) {
		return null;
	}
};
