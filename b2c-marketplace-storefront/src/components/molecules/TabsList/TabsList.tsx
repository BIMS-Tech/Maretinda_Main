import { TabsTrigger } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';

export const TabsList = ({
	list,
	activeTab,
}: {
	list: { label: string; link: string }[];
	activeTab: string;
}) => {
	return (
		<div className="flex gap-4 w-full">
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
