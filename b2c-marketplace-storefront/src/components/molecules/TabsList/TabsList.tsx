import { TabsTrigger } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { cn } from '@/lib/utils';

export const TabsList = ({
	list,
	activeTab,
	className,
}: {
	list: { label: string; link: string }[];
	activeTab: string;
	className?: string;
}) => {
	return (
		<div className={cn('flex gap-4 w-full', className)}>
			{list.map(({ label, link }) => (
				<LocalizedClientLink href={link} key={label}>
					<TabsTrigger isActive={activeTab === label.toLowerCase()}>
						{label}
					</TabsTrigger>
				</LocalizedClientLink>
			))}
		</div>
	);
};
