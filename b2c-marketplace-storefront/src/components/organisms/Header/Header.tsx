import type { HttpTypes } from '@medusajs/types';
import Image from 'next/image';

import { Badge } from '@/components/atoms';
import { CartDropdown, MobileNavbar, Navbar } from '@/components/cells';
import { SellNowButton } from '@/components/cells/SellNowButton/SellNowButton';
import { UserDropdown } from '@/components/cells/UserDropdown/UserDropdown';
import CountrySelector from '@/components/molecules/CountrySelector/CountrySelector';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { MessageButton } from '@/components/molecules/MessageButton/MessageButton';
import { PARENT_CATEGORIES } from '@/const';
import { HeartIcon, MessageIcon } from '@/icons';
import { retrieveCart } from '@/lib/data/cart';
import { listCategories } from '@/lib/data/categories';
import { retrieveCustomer } from '@/lib/data/customer';
import { listRegions } from '@/lib/data/regions';
import { getUserWishlists } from '@/lib/data/wishlist';
import type { Wishlist } from '@/types/wishlist';

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
			<div className="flex py-2 lg:px-8 px-4">
				<div className="flex items-center lg:w-1/3">
					<MobileNavbar
						childrenCategories={categories}
						parentCategories={parentCategories}
					/>
					<div className="hidden lg:block">
						<SellNowButton />
					</div>
				</div>
				<div className="flex lg:justify-center lg:w-1/3 items-center pl-4 lg:pl-0">
					<LocalizedClientLink
						className="text-2xl font-bold"
						href="/"
					>
						<Image
							alt="Logo"
							height={40}
							priority
							src="/Logo.png"
							width={126}
						/>
					</LocalizedClientLink>
				</div>
				<div className="flex items-center justify-end gap-2 lg:gap-4 w-full lg:w-1/3 py-2">
					{user && <MessageButton />}
					<UserDropdown user={user} />
					{user && (
						<LocalizedClientLink
							className="relative"
							href="/user/wishlist"
						>
							<HeartIcon size={20} />
							{Boolean(wishlistCount) && (
								<Badge className="absolute -top-2 -right-2 w-4 h-4 p-0">
									{wishlistCount}
								</Badge>
							)}
						</LocalizedClientLink>
					)}

					<CartDropdown cart={cart} />
					<CountrySelector regions={regions} />
				</div>
			</div>
			<Navbar categories={categories} />
		</header>
	);
};
