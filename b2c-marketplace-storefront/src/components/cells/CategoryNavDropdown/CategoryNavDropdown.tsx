'use client';

import { useState } from 'react';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { CollapseIcon } from '@/icons';
import { cn } from '@/lib/utils';

export interface MegaMenuLink {
	label: string;
	path: string;
}

export interface MegaMenuColumn {
	title: string;
	items: MegaMenuLink[];
}

export type MegaMenuData = MegaMenuColumn[];

const MEGA_MENU_DATA: MegaMenuData = [
	{
		items: [
			{ label: 'New Arrivals', path: 'women/new' },
			{ label: 'Sale', path: 'women/sale' },
			{ label: 'Coats', path: 'women/coats' },
			{ label: 'Pants', path: 'women/pants' },
			{ label: 'Jackets', path: 'women/jackets' },
			{ label: 'Tops', path: 'women/tops' },
			{ label: 'Shirts', path: 'women/shirts' },
			{ label: 'Jeans', path: 'women/jeans' },
			{ label: 'Suits', path: 'women/suits' },
		],
		title: "Women's clothing",
	},
	{
		items: [
			{ label: 'New Arrivals', path: 'men/new' },
			{ label: 'Sale', path: 'men/sale' },
			{ label: 'Coats', path: 'men/coats' },
			{ label: 'Pants', path: 'men/pants' },
			{ label: 'Jackets', path: 'men/jackets' },
			{ label: 'Tops', path: 'men/tops' },
			{ label: 'Shirts', path: 'men/shirts' },
			{ label: 'Jeans', path: 'men/jeans' },
			{ label: 'Suits', path: 'men/suits' },
		],
		title: "Men's clothing",
	},
	{
		items: [
			{ label: 'New Arrivals', path: 'kids/new' },
			{ label: 'Sale', path: 'kids/sale' },
			{ label: 'Baby Coats', path: 'kids/baby-coats' },
			{ label: 'Baby Pants', path: 'kids/baby-pants' },
			{ label: 'Baby Jackets', path: 'kids/baby-jackets' },
			{ label: 'Tops', path: 'kids/tops' },
			{ label: 'Shirts', path: 'kids/shirts' },
			{ label: 'Jeans', path: 'kids/jeans' },
			{ label: 'Suits', path: 'kids/suits' },
		],
		title: 'Kids',
	},
	{
		items: [
			{ label: 'New Arrivals', path: 'footwear/new' },
			{ label: 'Sale', path: 'footwear/sale' },
		],
		title: 'Footwear',
	},
	{
		items: [
			{ label: 'New Arrivals', path: 'accessories/new' },
			{ label: 'Sale', path: 'accessories/sale' },
		],
		title: 'Accessories',
	},
];

export const CategoryNavDropdown = ({
	handleCategory,
	handle,
	id,
	name,
	onClick,
}: {
	handleCategory: boolean;
	handle: string;
	id: string;
	name: string;
	onClick: () => void;
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
					handleCategory && 'md:border-primary',
				)}
				href={`/categories/${handle}`}
				key={id}
				onClick={onClick}
			>
				{name}
				<CollapseIcon className="-rotate-90 md:hidden" size={18} />
			</LocalizedClientLink>
			{open && (
				<div className="hidden md:block absolute top-[144px] lg:top-[70px] left-0 bg-primary text-primary z-30 w-full min-h-60 border-b py-10 lg:py-8">
					<div className="container !max-w-7xl mx-auto grid grid-cols-3 lg:grid-cols-5 justify-items-start lg:justify-items-center gap-6 gap-y-10 lg:gap-10">
						{MEGA_MENU_DATA.map((column: MegaMenuColumn) => (
							<div
								className="flex flex-col gap-3"
								key={column.title}
							>
								<h3 className="text-base lg:text-lg !font-semibold mb-4">
									{column.title}
								</h3>
								{column.items.map((link) => (
									<LocalizedClientLink
										className="text-base lg:text-lg !font-normal hover:underline hover:underline-offset-[6px]"
										href={`/categories/${link.path}`}
										key={link.label}
										onClick={onClick}
									>
										{link.label}
									</LocalizedClientLink>
								))}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};
