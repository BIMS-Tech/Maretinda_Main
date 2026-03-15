'use client';

import { usePathname } from 'next/navigation';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { ForwardIcon } from '@/icons';
import { cn } from '@/lib/utils';

interface BreadcrumbsProps {
	items: { label: string; path: string }[];
	className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
	const pathname = usePathname();

	return (
		<nav aria-label="Breadcrumb" className={cn('flex', className)}>
			<ol className="inline-flex items-center gap-2">
				{items.map(({ path, label }, index) => {
					const isActive = pathname === path;
					return (
						<li
							className="inline-flex items-center group"
							key={path}
						>
							{index > 0 && <ForwardIcon size={16} />}
							<LocalizedClientLink
								className={cn(
									'inline-flex items-center label-md text-primary group-last:!font-bold',
									index > 0 && 'ml-2',
									isActive && 'text-secondary',
								)}
								href={path}
							>
								{label}
							</LocalizedClientLink>
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
