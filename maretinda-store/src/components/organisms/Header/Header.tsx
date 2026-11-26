import type { HttpTypes } from '@medusajs/types';
import Image from 'next/image';
import Link from 'next/link';

import { CartDropdown, MobileNavbar } from '@/components/cells';
import { SellNowButton } from '@/components/cells/SellNowButton/SellNowButton';
import { UserDropdown } from '@/components/cells/UserDropdown/UserDropdown';
import { NavbarSearch } from '@/components/molecules';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { MessageButton } from '@/components/molecules/MessageButton/MessageButton';
import { PARENT_CATEGORIES } from '@/const';
import { NavText } from '@/i18n/NavText';
import { WishlistIcon2 } from '@/icons';
import { retrieveCart } from '@/lib/data/cart';
import { listCategories } from '@/lib/data/categories';
import { retrieveCustomer } from '@/lib/data/customer';
import { getUserWishlists } from '@/lib/data/wishlist';
import type { Wishlist } from '@/types/wishlist';

import TopHeaderBanner from '../TopHeader/TopHeader';
import { CategoryStrip } from './CategoryStrip';
import { HeaderShell } from './HeaderShell';


export const Header = async () => {
	const cart = await retrieveCart().catch(() => null);
	const user = await retrieveCustomer();
	let wishlist: Wishlist[] = [];

	if (user) {
		try {
			const response = await getUserWishlists();
			wishlist = response.wishlists;
		} catch {
			wishlist = [];
		}
	}

	const wishlistCount = wishlist?.[0]?.products.length || 0;

	const { categories, parentCategories } = (await listCategories({
		headingCategories: PARENT_CATEGORIES,
	})) as {
		categories: HttpTypes.StoreProductCategory[];
		parentCategories: HttpTypes.StoreProductCategory[];
	};

	return (
		<>
			<TopHeaderBanner />

			{/* Main purple header */}
			<HeaderShell strip={<CategoryStrip categories={(parentCategories.length > 0 ? parentCategories : categories).slice(0, 12)} />}>
				<div className="max-w-[1360px] mx-auto px-6 h-[72px] flex items-center gap-6">
					{/* Mobile hamburger + Logo */}
					<div className="flex items-center gap-3 shrink-0">
						<div className="lg:hidden">
							<MobileNavbar
								childrenCategories={categories}
								parentCategories={parentCategories}
							/>
						</div>
						<LocalizedClientLink href="/" className="flex items-center">
							<Image
								src="/logo-m-2.png"
								alt="Maretinda"
								width={160}
								height={52}
								className="object-contain w-[120px] sm:w-[150px] lg:w-[160px] h-auto"
								priority
							/>
						</LocalizedClientLink>
					</div>

					{/* Search bar */}
					<div className="flex-1 max-w-[680px] hidden lg:block">
						<NavbarSearch categories={categories} />
					</div>

					{/* Right icons */}
					<nav className="flex items-center gap-1 shrink-0 ml-auto lg:ml-0">
						<UserDropdown user={user} />

						{/* Wishlist */}
						{user ? (
							<LocalizedClientLink
								href="/user/wishlist"
								className="relative flex flex-col items-center justify-center px-2.5 py-2 rounded-lg hover:bg-white/10 transition-colors"
							>
								<span className="relative">
									<WishlistIcon2 className="text-white" size={22} />
									{Boolean(wishlistCount) && (
										<span
											className="absolute -top-1.5 -right-1.5 text-[9.5px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
											style={{ backgroundColor: '#FFC533', color: '#432C63' }}
										>
											{wishlistCount}
										</span>
									)}
								</span>
								<span className="text-[11px] text-white/80 hidden sm:block leading-none"><NavText k="wishlist" /></span>
							</LocalizedClientLink>
						) : (
							<Link
								href="/login?returnTo=/user/wishlist"
								className="flex flex-col items-center justify-center px-2.5 py-2 rounded-lg hover:bg-white/10 transition-colors"
							>
								<WishlistIcon2 className="text-white" size={22} />
								<span className="text-[11px] text-white/80 hidden sm:block leading-none"><NavText k="wishlist" /></span>
							</Link>
						)}

						{/* Cart — badge is handled inside CartDropdown */}
						<CartDropdown cart={cart} />

						{user && <MessageButton />}
						<div className="hidden lg:block ml-1">
							<SellNowButton />
						</div>
					</nav>
				</div>

				{/* Search on phones and tablets; the search bar above only fits from lg up */}
				<div className="lg:hidden px-4 pb-3" data-testid="mobile-search">
					<NavbarSearch categories={categories} />
				</div>

			</HeaderShell>
		</>
	);
};
