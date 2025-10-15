'use client';

import type { HttpTypes } from '@medusajs/types';
import { useState } from 'react';

import { CategoryNavbar, HeaderCategoryNavbar } from '@/components/molecules';
import { CloseIcon, HamburgerMenuIcon } from '@/icons';

export const MobileNavbar = ({
	childrenCategories,
	parentCategories,
}: {
	childrenCategories: HttpTypes.StoreProductCategory[];
	parentCategories: HttpTypes.StoreProductCategory[];
}) => {
	const [openMenu, setOpenMenu] = useState(false);

	const closeMenuHandler = () => {
		setOpenMenu(false);
	};

	return (
		<div className="md:hidden">
			<div onClick={() => setOpenMenu(true)}>
				<HamburgerMenuIcon />
			</div>
			{openMenu && (
				<div className="fixed w-full h-full bg-primary p-2 top-0 left-0 z-20">
					<div className="flex justify-end">
						<div onClick={() => closeMenuHandler()}>
							<CloseIcon size={24} />
						</div>
					</div>
					<div className="border mt-4 rounded-sm">
						<HeaderCategoryNavbar
							categories={parentCategories}
							onClose={closeMenuHandler}
						/>
						<div className="border-t pt-2">
							<CategoryNavbar
								categories={childrenCategories}
								onClose={closeMenuHandler}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
