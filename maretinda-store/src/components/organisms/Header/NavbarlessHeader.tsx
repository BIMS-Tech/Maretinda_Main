import Image from 'next/image';

import { CartDropdown } from '@/components/cells';
import { SellNowButton } from '@/components/cells/SellNowButton/SellNowButton';
import { UserDropdown } from '@/components/cells/UserDropdown/UserDropdown';
import { NavbarSearch } from '@/components/molecules';
// import CountrySelector from '@/components/molecules/CountrySelector/CountrySelector';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { retrieveCart } from '@/lib/data/cart';
import { listCategories } from '@/lib/data/categories';
import { retrieveCustomer } from '@/lib/data/customer';
import TopHeaderBanner from '../TopHeader/TopHeader';

export const NavbarLessHeader = async () => {
	const cart = await retrieveCart().catch(() => null);
	const user = await retrieveCustomer();
	const { categories } = await listCategories();

	return (
		<header>
			<TopHeaderBanner />
			<div className="max-w-7xl w-full mx-auto flex items-center justify-between py-5 lg:pt-8 lg:pb-4 px-4 gap-6">
				<div className="flex items-center w-full min-w-[150px] sm:min-w-max lg:max-w-[200px]">
					{/* <div className="hidden lg:block">
						<SellNowButton />
					</div> */}
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
				<div className="hidden lg:flex lg:justify-center w-full lg:max-w-[545px] items-center">
					<NavbarSearch categories={categories} />
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
