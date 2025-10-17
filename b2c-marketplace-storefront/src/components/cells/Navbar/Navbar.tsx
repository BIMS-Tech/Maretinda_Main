import type { HttpTypes } from '@medusajs/types';

import { CategoryNavbar, NavbarSearch } from '@/components/molecules';

export const Navbar = ({
	categories,
}: {
	categories: HttpTypes.StoreProductCategory[];
}) => {
	return (
		<div className="relative flex flex-col md:border-b justify-between items-stretch lg:items-center px-4 lg:px-6 gap-5">
			<div className="flex lg:hidden items-center">
				<NavbarSearch />
			</div>
			<div className="hidden md:flex justify-center items-center">
				<CategoryNavbar categories={categories} />
			</div>
		</div>
	);
};
