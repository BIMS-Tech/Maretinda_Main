import type { HttpTypes } from '@medusajs/types';
import Image from 'next/image';

import { Badge } from '@/components/atoms';
import { CartDropdown, MobileNavbar, Navbar } from '@/components/cells';
import { SellNowButton } from '@/components/cells/SellNowButton/SellNowButton';
import { UserDropdown } from '@/components/cells/UserDropdown/UserDropdown';
import { NavbarSearch } from '@/components/molecules';
// import CountrySelector from '@/components/molecules/CountrySelector/CountrySelector';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { MessageButton } from '@/components/molecules/MessageButton/MessageButton';
import { PARENT_CATEGORIES } from '@/const';
import { WishlistIcon2 } from '@/icons';
import { retrieveCart } from '@/lib/data/cart';
import { listCategories } from '@/lib/data/categories';
import { retrieveCustomer } from '@/lib/data/customer';
import { listRegions } from '@/lib/data/regions';
import { getUserWishlists } from '@/lib/data/wishlist';
import type { Wishlist } from '@/types/wishlist';

import TopHeaderBanner from '../TopHeader/TopHeader';

export const Header = async () => {
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

	const regions = await listRegions();

	const wishlistCount = wishlist?.[0]?.products.length || 0;

	const { categories, parentCategories } = (await listCategories({
		headingCategories: PARENT_CATEGORIES,
	})) as {
		categories: HttpTypes.StoreProductCategory[];
		parentCategories: HttpTypes.StoreProductCategory[];
	};

	return (
		<header>
			<TopHeaderBanner />
			<div className="max-w-7xl w-full mx-auto flex items-center justify-between py-5 lg:pt-8 lg:pb-4 px-4 gap-6">
				<div className="flex items-center w-full min-w-[150px] sm:min-w-max lg:max-w-[200px]">
					<MobileNavbar
						childrenCategories={categories}
						parentCategories={parentCategories}
					/>
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
				<div className="flex items-center justify-end gap-1 sm:gap-2 lg:gap-3 sm:min-w-[245px] w-[-webkit-fill-available] sm:w-auto">
					<UserDropdown user={user} />
					<CartDropdown cart={cart} />
					{user && (
						<LocalizedClientLink
							className="relative hidden sm:block min-w-[30px] md:min-w-[35px] xl:min-w-[45px] xl:pl-2"
							href="/user/wishlist"
						>
							<WishlistIcon2 className="ml-2" size={20} />
							{Boolean(wishlistCount) && (
								<Badge className="absolute -top-2 -right-2 md:-right-0 md:left-6 xl:left-8 w-4 h-4 p-0">
									{wishlistCount}
								</Badge>
							)}
						</LocalizedClientLink>
					)}
					{user && <MessageButton />}
					{/* <CountrySelector regions={regions} /> */}
					<SellNowButton />
				</div>
			</div>
			<Navbar categories={categories} />
		</header>
	);
};
