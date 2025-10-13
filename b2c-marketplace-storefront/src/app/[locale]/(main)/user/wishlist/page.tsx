import type { HttpTypes } from '@medusajs/types';
import { isEmpty } from 'lodash';
import { redirect } from 'next/navigation';

import { Button } from '@/components/atoms';
import { WishlistItem } from '@/components/cells';
import { UserNavigation } from '@/components/molecules';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
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
		redirect('/user');
	}

	return (
		<main className="container">
			<div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
				<UserNavigation />
				<div className="md:col-span-3 space-y-8">
					{isEmpty(wishlist?.[0]?.products) ? (
						<div className="w-96 mx-auto flex flex-col items-center justify-center">
							<h2 className="heading-lg text-primary uppercase mb-2">
								Wishlist
							</h2>
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
							<h2 className="heading-lg text-primary uppercase">
								Wishlist
							</h2>
							<div className="flex justify-between items-center">
								<p>{count} listings</p>
							</div>
							<div className="flex flex-wrap max-md:justify-center gap-4">
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
				</div>
			</div>
		</main>
	);
}
