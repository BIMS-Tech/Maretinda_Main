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

export const addWishlistItem = async ({
	reference_id,
	reference,
}: {
	reference_id: string;
	reference: 'product';
}) => {
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
	).then(() => {
		revalidatePath('/wishlist');
	});
};

export const removeWishlistItem = async ({
	wishlist_id,
	product_id,
}: {
	wishlist_id: string;
	product_id: string;
}) => {
	const headers = {
		...(await getAuthHeaders()),
		'Content-Type': 'application/json',
		'x-publishable-api-key': process.env
			.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
	};

	const response = await fetch(
		`${process.env.MEDUSA_BACKEND_URL}/store/wishlist/${wishlist_id}/product/${product_id}`,
		{
			headers,
			method: 'DELETE',
		},
	).then(() => {
		revalidatePath('/wishlist');
	});
};
