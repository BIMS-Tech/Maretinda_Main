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

function VoucherIcon({ size = 18 }: { size?: number }) {
	return (
		<svg
			aria-hidden="true"
			fill="none"
			height={size}
			viewBox="0 0 18 18"
			width={size}
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M11.25 2.25H6.75C5.50736 2.25 4.5 3.25736 4.5 4.5V5.25C5.32843 5.25 6 5.92157 6 6.75C6 7.57843 5.32843 8.25 4.5 8.25V9C4.5 10.2426 5.50736 11.25 6.75 11.25H11.25C12.4926 11.25 13.5 10.2426 13.5 9V8.25C12.6716 8.25 12 7.57843 12 6.75C12 5.92157 12.6716 5.25 13.5 5.25V4.5C13.5 3.25736 12.4926 2.25 11.25 2.25Z"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.5"
			/>
			<path
				d="M7.5 6.75H7.50833"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.75"
			/>
			<path
				d="M10.5 6.75H10.5083"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.75"
			/>
			<path
				d="M2.25 7.5H3"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.5"
			/>
			<path
				d="M2.25 10.5H3"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.5"
			/>
			<path
				d="M15 7.5H15.75"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.5"
			/>
			<path
				d="M15 10.5H15.75"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.5"
			/>
		</svg>
	);
}

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
		icon: <VoucherIcon />,
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
			.then((data) => {
				if (data?.unread) setUnreadCount(Number(data.unread));
			})
			.catch(() => {});
	}, [user]);

	const targetSegment = '/ph';
	const phIndex = path.indexOf(targetSegment);
	let pathAfterPH = '';
	if (phIndex !== -1) {
		pathAfterPH = path.substring(phIndex + targetSegment.length);
	}

	return (
		<div className="h-min rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(67,44,99,0.12)] border border-[#432C63]/[0.08] bg-white">
			{/* Profile header */}
			<div className="bg-[#432C63] px-6 py-7 flex flex-col items-center gap-3">
				<div className="relative">
					<Avatar
						className="rounded-full h-16 w-16 ring-[3px] ring-white/25"
						initials={user?.first_name?.[0]?.toUpperCase() ?? 'U'}
						size="large"
						src={'/talkjs-placeholder.jpg'}
					/>
					<span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 bg-emerald-400 rounded-full border-2 border-[#432C63]" />
				</div>
				<div className="text-center">
					<p className="text-white/50 text-[10.5px] font-semibold tracking-[0.18em] uppercase">
						My Account
					</p>
					<h2 className="text-white text-[16px] font-bold leading-snug mt-1">
						{user?.first_name} {user?.last_name}
					</h2>
				</div>
			</div>

			{/* Navigation items */}
			<div className="px-3 pt-3 pb-1">
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
			<div className="border-t border-[#432C63]/[0.08] mx-3 px-0 py-2.5">
				<NavigationItem
					active={pathAfterPH === '/user/settings'}
					href={'/user/settings'}
				>
					<SettingIcon />
					<span className="flex-1">Settings</span>
				</NavigationItem>
				<LogoutButton
					className="w-full text-left text-[#432C63]/60 label-md !font-medium capitalize px-4 py-2.5 my-0.5 flex items-center gap-3 rounded-lg transition-colors duration-150 hover:bg-red-50 hover:text-red-500"
					isSidebar
				/>
			</div>
		</div>
	);
};
