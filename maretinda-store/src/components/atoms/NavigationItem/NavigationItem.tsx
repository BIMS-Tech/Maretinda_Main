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
			'relative label-md !font-medium capitalize w-full px-4 py-2.5 my-1 flex items-center justify-start rounded-lg gap-3 transition-colors duration-150 text-[#4b5563] hover:bg-brandPurpleLighten hover:text-brandPurple',
			active && 'bg-brandPurpleLight text-white hover:bg-brandPurpleLight hover:text-white',
			className,
		)}
		href={href}
		{...props}
	>
		{children}
	</LocalizedClientLink>
);
