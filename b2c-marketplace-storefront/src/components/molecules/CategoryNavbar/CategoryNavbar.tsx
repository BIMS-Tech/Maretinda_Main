'use client';

import type { HttpTypes } from '@medusajs/types';
import { useParams } from 'next/navigation';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { CollapseIcon } from '@/icons';
import { cn } from '@/lib/utils';

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
			<LocalizedClientLink
				className={cn(
					'label-md uppercase px-4 my-3 md:my-0 flex items-center justify-between',
				)}
				href="/categories"
				onClick={() => (onClose ? onClose(false) : null)}
			>
				All Products
			</LocalizedClientLink>
			{categories?.map(({ id, handle, name }) => (
				<LocalizedClientLink
					className={cn(
						'label-md uppercase px-4 my-3 md:my-0 flex items-center justify-between',
						handle === category && 'md:border-b md:border-primary',
					)}
					href={`/categories/${handle}`}
					key={id}
					onClick={() => (onClose ? onClose(false) : null)}
				>
					{name}
					<CollapseIcon className="-rotate-90 md:hidden" size={18} />
				</LocalizedClientLink>
			))}
		</nav>
	);
};
