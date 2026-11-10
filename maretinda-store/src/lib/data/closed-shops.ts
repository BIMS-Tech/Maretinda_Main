'use server';

import { sdk } from '../config';

/** Handles of the shops whose plan has ended; listings and search hide them. */
export const getClosedShopHandles = async (): Promise<string[]> =>
	sdk.client
		.fetch<{ handles: string[] }>('/store/closed-shops', {
			next: { revalidate: 60 },
		})
		.then(({ handles }) => handles ?? [])
		.catch(() => []);
