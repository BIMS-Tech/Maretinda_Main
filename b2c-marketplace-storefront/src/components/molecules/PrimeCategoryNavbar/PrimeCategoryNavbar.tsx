'use client';

import { useParams } from 'next/navigation';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { primeCategories } from '@/data/categories';
import { cn } from '@/lib/utils';

export const PrimeCategoryNavbar = () => {
	const { category } = useParams();

	return (
		<div className="flex items-center gap-2">
			{Object.keys(primeCategories).map((key: string) => (
				<LocalizedClientLink
					className={cn(
						'uppercase label-lg px-2 pb-1',
						key === category && 'border-b border-primary',
					)}
					href={`/${key}`}
					key={key}
				>
					{primeCategories[key as keyof typeof primeCategories]}
				</LocalizedClientLink>
			))}
		</div>
	);
};
