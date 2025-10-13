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
			'label-md uppercase px-4 py-3 my-3 md:my-0 flex items-center justify-between',
			active && 'underline  underline-offset-8',
			className,
		)}
		href={href}
		{...props}
	>
		{children}
	</LocalizedClientLink>
);
