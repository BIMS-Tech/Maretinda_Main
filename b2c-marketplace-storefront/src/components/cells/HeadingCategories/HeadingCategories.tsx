'use client';

import type { HttpTypes } from '@medusajs/types';
import { useParams } from 'next/navigation';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { cn } from '@/lib/utils';

export const HeadingCategories = ({
	categories,
}: {
	categories: HttpTypes.StoreProductCategory[];
}) => {
	const { category } = useParams();

	return (
		<nav className="hidden lg:flex space-x-2 items-center flex-col md:flex-row">
			{categories?.map(({ id, handle, name }) => (
				<LocalizedClientLink
					className={cn(
						'label-md uppercase px-2 mb-4 md:mb-0',
						handle === category && 'border-b border-primary',
					)}
					href={`/categories/${handle}`}
					key={id}
				>
					{name}
				</LocalizedClientLink>
			))}
		</nav>
	);
};
