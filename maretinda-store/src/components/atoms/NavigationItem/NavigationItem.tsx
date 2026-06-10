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
			'relative label-md !font-medium capitalize w-full px-4 py-2.5 my-0.5 flex items-center justify-start rounded-lg gap-3 transition-colors duration-150 text-[#432C63]/70 hover:bg-[#F0EBF8] hover:text-[#432C63]',
			active && 'bg-[#432C63] text-white hover:bg-[#432C63] hover:text-white',
			className,
		)}
		href={href}
		{...props}
	>
		{children}
	</LocalizedClientLink>
);
