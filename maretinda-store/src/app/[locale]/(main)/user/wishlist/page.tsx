import type { HttpTypes } from '@medusajs/types';
import { Container } from '@medusajs/ui';
import { isEmpty } from 'lodash';
import { redirect } from 'next/navigation';

import { Button } from '@/components/atoms';
import { WishlistItem } from '@/components/cells';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { Layout } from '@/components/organisms';
import { retrieveCustomer } from '@/lib/data/customer';
import { getUserWishlists } from '@/lib/data/wishlist';
import type { Wishlist as WishlistType } from '@/types/wishlist';

export default async function Wishlist() {
	const user = await retrieveCustomer();

	let wishlist: WishlistType[] = [];
	if (user) {
		try {
			const response = await getUserWishlists();
			wishlist = response.wishlists;
		} catch (error) {
			console.warn('Failed to fetch wishlist:', error);
			// Continue without wishlist data instead of crashing
			wishlist = [];
		}
	}

	const count = wishlist?.[0]?.products?.length || 0;

	if (!user) {
		redirect('/login');
	}

	return (
		<Layout>
			<Container className="md:col-span-3 flex flex-col user-content-wrapper">
				<h1 className="mb-12 font-lora font-bold text-4xl text-black">
					Wishlists
				</h1>
				{isEmpty(wishlist?.[0]?.products) ? (
					<div className="max-w-96 mx-auto flex flex-col items-center justify-center">
						<p className="text-lg text-secondary mb-6">
							Your wishlist is currently empty.
						</p>
						<LocalizedClientLink
							className="w-full"
							href="/categories"
						>
							<Button className="w-full">Explore</Button>
						</LocalizedClientLink>
					</div>
				) : (
					<div className="flex flex-col gap-6">
						<p className="font-medium text-[#a0a0a0] text-sm">
							{count} listings
						</p>
						<div className="flex flex-wrap max-md:justify-center gap-6">
							{wishlist?.[0].products?.map((product) => (
								<WishlistItem
									key={product.id}
									product={
										product as HttpTypes.StoreProduct & {
											calculated_amount: number;
											currency_code: string;
										}
									}
									user={user}
									wishlist={wishlist}
								/>
							))}
						</div>
					</div>
				)}
			</Container>
		</Layout>
	);
}
