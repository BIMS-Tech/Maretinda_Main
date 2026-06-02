'use client';

import type { HttpTypes } from '@medusajs/types';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import {
	Avatar,
	Badge,
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
	{
		href: '/user/vouchers',
		icon: <span className="text-base leading-none">🎟️</span>,
		label: 'My Vouchers',
	},
];

export const UserNavigation = ({
	user,
}: {
	user: HttpTypes.StoreCustomer | null;
}) => {
	const [unreadCount, setUnreadCount] = useState(0);
	const path = usePathname();

	useEffect(() => {
		if (!user) return;
		fetch('/api/chat')
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => { if (data?.unread) setUnreadCount(Number(data.unread)); })
			.catch(() => {});
	}, [user]);

	const targetSegment = '/ph';
	const phIndex = path.indexOf(targetSegment);
	let pathAfterPH = '';
	if (phIndex !== -1) {
		pathAfterPH = path.substring(phIndex + targetSegment.length);
	}

	return (
		<div className="h-min rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-black/[0.07] bg-white">
			{/* Profile header */}
			<div className="bg-brandPurple px-6 py-8 flex flex-col items-center gap-3">
				<div className="relative">
					<Avatar
						className="rounded-full h-16 w-16 ring-[3px] ring-white/30"
						initials={user?.first_name?.[0]?.toUpperCase() ?? 'U'}
						size="large"
						src={'/talkjs-placeholder.jpg'}
					/>
					<span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 bg-green-400 rounded-full border-2 border-brandPurple" />
				</div>
				<div className="text-center">
					<p className="text-white/60 text-[11px] font-medium tracking-widest uppercase">
						My Account
					</p>
					<h2 className="text-white text-[17px] font-semibold leading-snug mt-0.5">
						{user?.first_name} {user?.last_name}
					</h2>
				</div>
			</div>

			{/* Navigation items */}
			<div className="px-3 pt-4 pb-2">
				{navigationItems.map((item) => (
					<NavigationItem
						active={pathAfterPH === item.href}
						className="relative"
						href={item.href}
						key={item.label}
					>
						{item.icon}
						<span className="flex-1">{item.label}</span>
						{item.label === 'Messages' && unreadCount > 0 && (
							<Badge className="w-5 h-5 p-0 text-xs flex items-center justify-center">
								{unreadCount}
							</Badge>
						)}
					</NavigationItem>
				))}
			</div>

			{/* Footer: settings + logout */}
			<div className="border-t border-black/[0.07] mx-3 px-0 py-3">
				<NavigationItem
					active={pathAfterPH === '/user/settings'}
					href={'/user/settings'}
				>
					<SettingIcon />
					<span className="flex-1">Settings</span>
				</NavigationItem>
				<LogoutButton className="w-full text-left text-[#4b5563] label-md !font-medium capitalize px-4 py-2.5 my-1 flex items-center gap-3 rounded-lg transition-colors duration-150 hover:bg-red-50 hover:text-red-500" isSidebar />
			</div>
		</div>
	);
};
