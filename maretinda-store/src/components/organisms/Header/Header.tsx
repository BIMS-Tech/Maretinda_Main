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
import { WishlistIcon2 } from '@/icons';
import { retrieveCart } from '@/lib/data/cart';
import { listCategories } from '@/lib/data/categories';
import { retrieveCustomer } from '@/lib/data/customer';
import { getUserWishlists } from '@/lib/data/wishlist';
import type { Wishlist } from '@/types/wishlist';

import TopHeaderBanner from '../TopHeader/TopHeader';

const NAV_CATEGORIES = [
	{ label: 'Fresh Groceries', href: '/categories/fresh-groceries' },
	{ label: 'Food & Beverage', href: '/categories/food-beverage' },
	{ label: 'Fashion', href: '/categories/fashion' },
	{ label: 'Electronics', href: '/categories/electronics' },
	{ label: 'Beauty', href: '/categories/beauty' },
	{ label: 'Home & Living', href: '/categories/home-living' },
	{ label: 'Mobile', href: '/categories/mobile' },
	{ label: 'Baby & Kids', href: '/categories/baby-kids' },
	{ label: 'Health', href: '/categories/health' },
];

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
		<header>
			<TopHeaderBanner />

			{/* Main purple header */}
			<div className="sticky top-0 z-40" style={{ backgroundColor: '#432C63' }}>
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
								width={120}
								height={40}
								className="object-contain"
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
								<span className="text-[11px] text-white/80 hidden sm:block leading-none">Wishlist</span>
							</LocalizedClientLink>
						) : (
							<Link
								href="/wishlist"
								className="flex flex-col items-center justify-center px-2.5 py-2 rounded-lg hover:bg-white/10 transition-colors"
							>
								<WishlistIcon2 className="text-white" size={22} />
								<span className="text-[11px] text-white/80 hidden sm:block leading-none">Wishlist</span>
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

				{/* Category nav strip */}
				<div style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
					<div className="max-w-[1360px] mx-auto px-6 h-11 hidden md:flex items-center gap-1 text-[13px]">
						{/* All categories button */}
						<button
							className="flex items-center gap-2 px-3 py-1.5 rounded-md font-semibold text-white transition-colors"
							style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
						>
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<line x1="4" y1="6" x2="20" y2="6" />
								<line x1="4" y1="12" x2="20" y2="12" />
								<line x1="4" y1="18" x2="20" y2="18" />
							</svg>
							All Categories
						</button>

						<span className="opacity-20 mx-1 text-white">|</span>

						{NAV_CATEGORIES.map((cat) => (
							<LocalizedClientLink
								key={cat.href}
								href={cat.href}
								className="px-3 py-1.5 rounded-md text-white/85 hover:text-[#FFC533] hover:bg-white/10 transition-colors whitespace-nowrap"
							>
								{cat.label}
							</LocalizedClientLink>
						))}

						<span className="flex-1" />

						{/* Flash sale live indicator */}
						<LocalizedClientLink
							href="/categories"
							className="px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5"
							style={{ color: '#FFC533' }}
						>
							<span className="relative flex w-2 h-2">
								<span className="absolute inset-0 rounded-full animate-ping opacity-75" style={{ backgroundColor: '#FFC533' }} />
								<span className="relative inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#FFC533' }} />
							</span>
							Flash Sale Live
						</LocalizedClientLink>
					</div>
				</div>
			</div>
		</header>
	);
};
