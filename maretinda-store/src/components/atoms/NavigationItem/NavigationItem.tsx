'use client';

import * as m from 'motion/react-m';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { SPRING } from '@/components/motion/tokens';
import { cn } from '@/lib/utils';

interface NavigationItemProps extends React.ComponentPropsWithoutRef<'a'> {
	active?: boolean;
}

/** A link of the account menu; the pill slides to the page being shown. */
export const NavigationItem: React.FC<NavigationItemProps> = ({ children, href = '/', className, active, ...props }) => (
	<LocalizedClientLink
		aria-current={active ? 'page' : undefined}
		className={cn(
			'relative label-md !font-medium capitalize w-full px-4 py-2.5 my-0.5 flex items-center justify-start rounded-xl transition-colors duration-200',
			active ? 'text-white' : 'text-[#432C63]/70 hover:bg-[#F6F2FB] hover:text-[#432C63]',
			className,
		)}
		href={href}
		{...props}
	>
		{active && <m.span className="absolute inset-0 rounded-xl bg-[#432C63]" layoutId="account-menu" transition={SPRING} />}
		<span className="relative flex w-full items-center gap-3">{children}</span>
	</LocalizedClientLink>
);
