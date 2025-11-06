import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { cn } from '@/lib/utils';

interface NavigationItemProps extends React.ComponentPropsWithoutRef<'a'> {
	active?: boolean;
}

export const NavigationItem: React.FC<NavigationItemProps> = ({
	children,
	href = '/',
	className,
	active,
	...props
}) => (
	<LocalizedClientLink
		className={cn(
			'relative label-md !font-medium text-black capitalize w-fit lg:min-w-[157px] px-4 lg:px-6 py-2.5 my-3 md:my-2.5 flex items-center justify-start rounded-[6px] gap-4',
			active &&
				'bg-brandPurpleLight text-white before:absolute before:content-[""] before:-left-4 lg:before:-left-8 before:bg-brandPurple before:w-1 before:h-full before:block before:rounded-full',
			className,
		)}
		href={href}
		{...props}
	>
		{children}
	</LocalizedClientLink>
);
