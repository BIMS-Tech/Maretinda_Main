'use server';

import { sdk } from '../config';
import { getAuthHeaders } from './cookies';

export type Reel = {
	id: string;
	seller_id: string;
	title: string;
	description: string | null;
	video_url: string;
	thumbnail_url: string | null;
	duration: number | null;
	product_ids: string[];
	view_count: number;
	like_count: number;
	published_at: string | null;
	created_at: string;
	seller_name: string;
	seller_handle: string | null;
	seller_photo: string | null;
	liked?: boolean;
};

/**
 * Reels are public, so an anonymous read still succeeds — the auth header is
 * only sent so signed-in shoppers get their `liked` state back with the feed.
 */
export const listReels = async ({
	seller_id,
	limit = 20,
	offset = 0,
}: {
	seller_id?: string;
	limit?: number;
	offset?: number;
} = {}): Promise<{ reels: Reel[]; count: number }> => {
	const headers = { ...(await getAuthHeaders()) };

	const query: Record<string, string | number> = { limit, offset };
	if (seller_id) query.seller_id = seller_id;

	return sdk.client
		.fetch<{ reels: Reel[]; count: number }>('/store/reels', {
			headers,
			method: 'GET',
			query,
			cache: 'no-store',
		})
		.catch(() => ({ reels: [], count: 0 }));
};

export const getReel = async (id: string): Promise<Reel | null> => {
	const headers = { ...(await getAuthHeaders()) };

	return sdk.client
		.fetch<{ reel: Reel }>(`/store/reels/${id}`, {
			headers,
			method: 'GET',
			cache: 'no-store',
		})
		.then((res) => res.reel)
		.catch(() => null);
};
