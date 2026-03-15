import Image from 'next/image';

import { CartDropdown } from '@/components/cells';
import { SellNowButton } from '@/components/cells/SellNowButton/SellNowButton';
import { UserDropdown } from '@/components/cells/UserDropdown/UserDropdown';
import { NavbarSearch } from '@/components/molecules';
// import CountrySelector from '@/components/molecules/CountrySelector/CountrySelector';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { retrieveCart } from '@/lib/data/cart';
import { retrieveCustomer } from '@/lib/data/customer';
import { getUserWishlists } from '@/lib/data/wishlist';
import type { Wishlist } from '@/types/wishlist';

import TopHeaderBanner from '../TopHeader/TopHeader';

export const NavbarLessHeader = async () => {
	const cart = await retrieveCart().catch(() => null);
	const user = await retrieveCustomer();
	let wishlist: Wishlist[] = [];

	// Only try to get wishlist if user is authenticated
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

	const wishlistCount = wishlist?.[0]?.products.length || 0;

	return (
		<header>
			<TopHeaderBanner />
			<div className="max-w-7xl w-full mx-auto flex items-center justify-between py-5 lg:pt-8 lg:pb-4 px-4 gap-6">
				<div className="flex items-center w-full min-w-[150px] sm:min-w-max lg:max-w-[200px]">
					{/* <div className="hidden lg:block">
						<SellNowButton />
					</div> */}
					<LocalizedClientLink
						className="text-2xl font-bold"
						href="/"
					>
						<Image
							alt="Logo"
							className="object-contain w-[125px] lg:w-[200px]"
							height={35}
							priority
							src="/Logo-maretinda.svg"
							width={200}
						/>
					</LocalizedClientLink>
				</div>
				<div className="hidden lg:flex lg:justify-center w-full lg:max-w-[545px] items-center">
					<NavbarSearch />
				</div>
				<div className="flex items-center justify-end gap-1 sm:gap-2 lg:gap-2 sm:min-w-[245px] w-[-webkit-fill-available] sm:w-auto">
					<UserDropdown user={user} />
					<CartDropdown cart={cart} />
					{/* <CountrySelector regions={regions} /> */}
					<SellNowButton />
				</div>
			</div>
		</header>
	);
};
