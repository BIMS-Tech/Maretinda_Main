'use server';

import { revalidatePath } from 'next/cache';

import type { Wishlist } from '@/types/wishlist';

import { sdk } from '../config';
import { getAuthHeaders } from './cookies';

export const getUserWishlists = async () => {
	try {
		const headers = {
			...(await getAuthHeaders()),
			'Content-Type': 'application/json',
			'x-publishable-api-key': process.env
				.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
		};

		// Check if we have authentication headers
		if (!headers.authorization) {
			console.warn('No authentication token found for wishlist request');
			return { count: 0, wishlists: [] };
		}

		return sdk.client
			.fetch<{ wishlists: Wishlist[]; count: number }>(
				`/store/wishlist`,
				{
					cache: 'no-cache',
					headers,
					method: 'GET',
				},
			)
			.then((res) => {
				return res;
			})
			.catch((error) => {
				console.warn('Wishlist API error:', error);
				// Return empty wishlist instead of throwing
				return { count: 0, wishlists: [] };
			});
	} catch (error) {
		console.warn('Failed to fetch wishlist:', error);
		return { count: 0, wishlists: [] };
	}
};

// Server actions return a status instead of throwing: Next.js hides thrown
// messages from the client in production builds.
export type WishlistActionResult = { ok: boolean; status: number };

// The wishlist feeds the header count, every product card's heart and the
// wishlist page, so refresh the whole tree rather than one path (the pages
// live under /[locale], so a bare '/wishlist' never matched anything).
const refreshWishlistViews = () => revalidatePath('/', 'layout');

export const addWishlistItem = async ({
	reference_id,
	reference,
}: {
	reference_id: string;
	reference: 'product';
}): Promise<WishlistActionResult> => {
	const headers = {
		...(await getAuthHeaders()),
		'Content-Type': 'application/json',
		'x-publishable-api-key': process.env
			.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
	};

	const response = await fetch(
		`${process.env.MEDUSA_BACKEND_URL}/store/wishlist`,
		{
			body: JSON.stringify({
				reference,
				reference_id,
			}),
			headers,
			method: 'POST',
		},
	);

	if (response.ok) {
		refreshWishlistViews();
	}
	return { ok: response.ok, status: response.status };
};

export const removeWishlistItem = async ({
	product_id,
}: {
	product_id: string;
}): Promise<WishlistActionResult> => {
	const headers = {
		...(await getAuthHeaders()),
		'Content-Type': 'application/json',
		'x-publishable-api-key': process.env
			.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
	};

	// Mercur 1.5 finds the wishlist from the signed-in customer; the old
	// /store/wishlist/:id/product/:reference_id route no longer exists
	const response = await fetch(
		`${process.env.MEDUSA_BACKEND_URL}/store/wishlist/product/${product_id}`,
		{
			headers,
			method: 'DELETE',
		},
	);

	if (response.ok) {
		refreshWishlistViews();
	}
	return { ok: response.ok, status: response.status };
};
