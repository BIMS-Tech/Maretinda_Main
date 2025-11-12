import type React from 'react';

import { TabsTrigger } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { cn } from '@/lib/utils';

export const TabsList = ({
	list,
	activeTab,
	className,
}: {
	list: { label: string; link?: string; children?: React.ReactNode }[];
	activeTab: string;
	className?: string;
}) => {
	return (
		<div className={cn('flex gap-4 w-full', className)}>
			{list.map(({ children, label, link }) =>
				link && !children ? (
					<LocalizedClientLink href={link} key={label}>
						<TabsTrigger
							isActive={activeTab === label.toLowerCase()}
						>
							{label}
						</TabsTrigger>
					</LocalizedClientLink>
				) : (
					<TabsTrigger
						isActive={activeTab === label.toLowerCase()}
						key={label}
					>
						{children}
					</TabsTrigger>
				),
			)}
		</div>
	);
};
