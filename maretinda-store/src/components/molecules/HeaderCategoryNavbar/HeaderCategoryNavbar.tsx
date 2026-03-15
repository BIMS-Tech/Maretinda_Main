'use client';

import type { HttpTypes } from '@medusajs/types';

import { Button } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { cn } from '@/lib/utils';

export const HeaderCategoryNavbar = ({
	categories,
	onClose,
}: {
	categories: HttpTypes.StoreProductCategory[];
	onClose?: (state: boolean) => void;
}) => {
	return (
		<nav className="flex items-center flex-col p-1 gap-1">
			{categories?.map(({ id, handle, name }) => (
				<LocalizedClientLink
					className={cn('label-md uppercase w-full')}
					href={`/categories/${handle}`}
					key={id}
					onClick={() => (onClose ? onClose(false) : null)}
				>
					<Button className="w-full rounded-sm">{name}</Button>
				</LocalizedClientLink>
			))}
		</nav>
	);
};
