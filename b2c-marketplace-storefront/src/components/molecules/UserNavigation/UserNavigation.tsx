'use client';

import { useUnreads } from '@talkjs/react';
import { usePathname } from 'next/navigation';

import {
	Avatar,
	Badge,
	Card,
	Divider,
	LogoutButton,
	NavigationItem,
} from '@/components/atoms';
import {
	ArrowUTurnIcon,
	CartIcon,
	ChatBubbleIcon,
	DashboardIcon,
	HeartIcon,
	HouseIcon,
	SettingIcon,
	StarIcon,
} from '@/icons/navigation';

const navigationItems = [
	{
		href: '/user',
		icon: <DashboardIcon />,
		label: 'Dashboard',
	},
	{
		href: '/user/orders',
		icon: <CartIcon />,
		label: 'Orders',
	},
	{
		href: '/user/messages',
		icon: <ChatBubbleIcon />,

		label: 'Messages',
	},
	{
		href: '/user/returns',
		icon: <ArrowUTurnIcon />,
		label: 'Returns',
	},
	{
		href: '/user/addresses',
		icon: <HouseIcon />,
		label: 'Addresses',
	},
	{
		href: '/user/reviews',
		icon: <StarIcon />,
		label: 'Reviews',
	},
	{
		href: '/user/wishlist',
		icon: <HeartIcon />,
		label: 'Wishlist',
	},
];

export const UserNavigation = () => {
	const unreads = useUnreads();
	const path = usePathname();
	const targetSegment = '/ph';

	const phIndex = path.indexOf(targetSegment);

	let pathAfterPH = '';
	if (phIndex !== -1) {
		const startIndex = phIndex + targetSegment.length;
		pathAfterPH = path.substring(startIndex);
	}

	return (
		<Card className="h-min px-4 lg:p-8 shadow-[0px_4px_6px_-6px_rgba(0,_0,_0,_0.25)] !border-black/15">
			<div className="flex items-center gap-3">
				<Avatar
					className="rounded-full h-12 w-12"
					initials="M"
					size="large"
					src={'/talkjs-placeholder.jpg'}
				/>
				<div className="flex flex-col gap-1">
					<span className="label-sm !font-medium text-[#18181B]">
						Hello!
					</span>
					<span className="label-lg !font-medium text-black !leading-none">
						Pansu2970
					</span>
				</div>
			</div>
			<Divider className="mb-7 mt-6 -mx-3  w-[calc(100%+24px)]" />
			{navigationItems.map((item) => (
				<NavigationItem
					active={pathAfterPH === item.href}
					className="relative"
					href={item.href}
					key={item.label}
				>
					{item.icon}
					{item.label}
					{item.label === 'Messages' && Boolean(unreads?.length) && (
						<Badge className="absolute top-3 left-24 w-4 h-4 p-0">
							{unreads?.length}
						</Badge>
					)}
				</NavigationItem>
			))}
			<Divider className="my-4 -mx-4 lg:-mx-8 w-[calc(100%+32px)] lg:w-[calc(100%+64px)]" />
			<NavigationItem
				active={pathAfterPH === '/user/settings'}
				href={'/user/settings'}
			>
				<SettingIcon />
				Settings
			</NavigationItem>
			<LogoutButton className="w-full text-left" isSidebar />
		</Card>
	);
};
