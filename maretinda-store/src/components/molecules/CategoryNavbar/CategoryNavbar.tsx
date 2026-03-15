'use client';

import type { HttpTypes } from '@medusajs/types';
import { useParams } from 'next/navigation';

import { CategoryNavDropdown } from '@/components/cells/CategoryNavDropdown/CategoryNavDropdown';
import { sortCategories } from '@/lib/utils';

export const CategoryNavbar = ({
	categories,
	onClose,
}: {
	categories: HttpTypes.StoreProductCategory[];
	onClose?: (state: boolean) => void;
}) => {
	const { category } = useParams();

	return (
		<nav className="flex md:items-center flex-col md:flex-row">
			{categories
				?.sort(sortCategories)
				.map(({ category_children, id, handle, name }) => (
					<CategoryNavDropdown
						handle={handle}
						handleCategory={handle === category}
						id={id}
						key={id}
						name={name}
						onClick={() => (onClose ? onClose(false) : null)}
						subcategories={category_children}
					/>
				))}
		</nav>
	);
};
