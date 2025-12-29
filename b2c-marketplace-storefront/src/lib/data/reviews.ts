'use server';

import type { HttpTypes } from '@medusajs/types';
import { revalidatePath } from 'next/cache';

import { sdk } from '../config';
import { getAuthHeaders } from './cookies';

export type Review = {
	id: string;
	customer: HttpTypes.StoreCustomer;
	seller: {
		id: string;
		name: string;
		photo: string;
	};
	reference: string;
	customer_note: string;
	seller_note: string;
	rating: number;
	updated_at: string;
	created_at: string;
};

export type Order = HttpTypes.StoreOrder & {
	seller: { id: string; name: string; reviews?: any[] };
	reviews: any[];
};

const getReviews = async () => {
	const headers = {
		...(await getAuthHeaders()),
	};

	const reviews = await sdk.client.fetch('/store/reviews', {
		headers,
		method: 'GET',
		query: { fields: '*seller,+seller.id,+customer.id,+order_id' },
	});

	return reviews as { reviews: Review[] };
};

const createReview = async (review: any) => {
	const headers = {
		...(await getAuthHeaders()),
		'Content-Type': 'application/json',
		'x-publishable-api-key': process.env
			.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
	};

	const response = await fetch(
		`${process.env.MEDUSA_BACKEND_URL}/store/reviews`,
		{
			body: JSON.stringify(review),
			headers,
			method: 'POST',
		},
	).then((res) => {
		revalidatePath('/user/reviews');
		revalidatePath('/user/reviews/written');
		revalidatePath('/products', 'page');
		revalidatePath('/sellers', 'page');
		return res;
	});

	return response.json();
};

export { createReview, getReviews };
