'use client';

import { useUnreads } from '@talkjs/react';
import { usePathname } from 'next/navigation';

import {
	Badge,
	Card,
	Divider,
	LogoutButton,
	NavigationItem,
} from '@/components/atoms';

const navigationItems = [
	{
		href: '/user/orders',
		label: 'Orders',
	},
	{
		href: '/user/messages',

		label: 'Messages',
	},
	{
		href: '/user/returns',
		label: 'Returns',
	},
	{
		href: '/user/addresses',
		label: 'Addresses',
	},
	{
		href: '/user/reviews',
		label: 'Reviews',
	},
	{
		href: '/user/wishlist',
		label: 'Wishlist',
	},
];

export const UserNavigation = () => {
	const unreads = useUnreads();
	const path = usePathname();

	return (
		<Card className="h-min">
			{navigationItems.map((item) => (
				<NavigationItem
					active={path === item.href}
					className="relative"
					href={item.href}
					key={item.label}
				>
					{item.label}
					{item.label === 'Messages' && Boolean(unreads?.length) && (
						<Badge className="absolute top-3 left-24 w-4 h-4 p-0">
							{unreads?.length}
						</Badge>
					)}
				</NavigationItem>
			))}
			<Divider className="my-2" />
			<NavigationItem
				active={path === '/user/settings'}
				href={'/user/settings'}
			>
				Settings
			</NavigationItem>
			<LogoutButton className="w-full text-left" />
		</Card>
	);
};
