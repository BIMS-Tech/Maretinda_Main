'use client';

import type { HttpTypes } from '@medusajs/types';
import { useState } from 'react';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { CollapseIcon } from '@/icons';
import { cn, sortCategories } from '@/lib/utils';

export const CategoryNavDropdown = ({
	handleCategory,
	handle,
	id,
	name,
	onClick,
	subcategories,
}: {
	handleCategory: boolean;
	handle: string;
	id: string;
	name: string;
	onClick: () => void;
	subcategories: HttpTypes.StoreProductCategory[];
}) => {
	const [open, setOpen] = useState(false);

	return (
		<div
			onFocus={() => setOpen(true)}
			onMouseLeave={() => setOpen(false)}
			onMouseOver={() => setOpen(true)}
		>
			<LocalizedClientLink
				className={cn(
					'category-navbar',
					'hover:border-primary',
					handleCategory && 'md:border-primary',
				)}
				href={`/categories/${handle}`}
				key={id}
				onClick={onClick}
			>
				{name}
				<CollapseIcon className="-rotate-90 md:hidden" size={18} />
			</LocalizedClientLink>
			{open && subcategories.length > 0 && (
				<div className="hidden md:block absolute top-[144px] lg:top-[70px] left-0 bg-primary text-primary z-30 w-full min-h-60 border-b py-10 lg:py-8">
					<div className="container !max-w-7xl mx-auto grid grid-cols-3 lg:grid-cols-5 justify-items-start lg:justify-items-center gap-6 gap-y-10 lg:gap-10">
						{subcategories
							?.sort(sortCategories)
							.map((subcategory) => (
								<LocalizedClientLink
									className="text-base lg:text-lg !font-normal hover:underline hover:underline-offset-[6px]"
									href={`/categories/${handle}/${subcategory.handle}`}
									key={subcategory.name}
									onClick={onClick}
								>
									{subcategory.name}
								</LocalizedClientLink>
							))}
					</div>
				</div>
			)}
		</div>
	);
};
