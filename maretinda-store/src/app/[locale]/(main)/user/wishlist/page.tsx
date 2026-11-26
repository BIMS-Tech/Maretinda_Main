import { redirect } from 'next/navigation';

import { Layout } from '@/components/organisms';
import { AccountEmpty, AccountHeading } from '@/components/organisms/Layout/AccountHeading';
import { WishlistGrid, type WishlistProduct } from '@/components/organisms/WishlistGrid/WishlistGrid';
import { retrieveCustomer } from '@/lib/data/customer';
import { getUserWishlists } from '@/lib/data/wishlist';

export default async function Wishlist() {
	const user = await retrieveCustomer();
	if (!user) redirect('/login?returnTo=/user/wishlist');

	const { wishlists } = await getUserWishlists();
	const products = (wishlists?.[0]?.products ?? []) as WishlistProduct[];

	return (
		<Layout>
			<div className="md:col-span-3 user-content-wrapper">
				<AccountHeading note={products.length ? `${products.length} ${products.length === 1 ? 'item' : 'items'} saved` : undefined} title="Wishlist" />
				{products.length ? (
					<WishlistGrid products={products} />
				) : (
					<AccountEmpty
						action="Find something you love"
						href="/search?sort=popular"
						icon={
							<svg aria-hidden="true" fill="none" height="30" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24" width="30">
								<path d="M12 20.500s-7.500-4.600-9.300-9.200C1.400 7.800 3.600 4.500 7 4.500c2.100 0 3.800 1.200 5 2.900 1.200-1.700 2.900-2.900 5-2.900 3.400 0 5.600 3.300 4.300 6.800-1.800 4.600-9.300 9.200-9.300 9.200z" />
							</svg>
						}
						title="Your wishlist is empty"
					>
						Tap the heart on anything you like and it will be kept here.
					</AccountEmpty>
				)}
			</div>
		</Layout>
	);
}
