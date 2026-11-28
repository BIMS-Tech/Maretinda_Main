'use client';

import type { HttpTypes } from '@medusajs/types';
import { useEffect, useRef, useState } from 'react';

import { LogoutButton } from '@/components/atoms';
import { Dropdown } from '@/components/molecules';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { ProfileIcon2 } from '@/icons';
import { useLanguage } from '@/providers/LanguageProvider';

type NavKey =
	| 'orders'
	| 'returns'
	| 'addresses'
	| 'reviews'
	| 'wishlist'
	| 'vouchers'
	| 'settings';

const MENU_HREFS: { key: NavKey; href: string }[] = [
	{ href: '/user/orders', key: 'orders' },
	{ href: '/user/returns', key: 'returns' },
	{ href: '/user/addresses', key: 'addresses' },
	{ href: '/user/reviews', key: 'reviews' },
	{ href: '/user/wishlist', key: 'wishlist' },
	{ href: '/user/vouchers', key: 'vouchers' },
	{ href: '/user/settings', key: 'settings' },
];

export const UserDropdown = ({
	user,
}: {
	user: HttpTypes.StoreCustomer | null;
}) => {
	const { t } = useLanguage();
	const s = t.nav;

	const [open, setOpen] = useState(false);
	// A short pause before opening and closing, so passing the pointer over it doesn't flash the menu
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const later = (next: boolean, ms: number) => {
		clearTimeout(timer.current);
		timer.current = setTimeout(() => setOpen(next), ms);
	};
	useEffect(() => () => clearTimeout(timer.current), []);

	const [unreadCount, setUnreadCount] = useState(0);

	useEffect(() => {
		if (!user) return;
		fetch('/api/chat')
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => {
				if (data?.unread) setUnreadCount(Number(data.unread));
			})
			.catch(() => {});
	}, [user]);

	// Signed out, Account simply opens sign-in: the page itself offers creating an account
	if (!user) {
		return (
			<LocalizedClientLink
				className="flex flex-col items-center justify-center gap-0.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-white/10"
				data-testid="header-account"
				href="/login"
			>
				<ProfileIcon2 className="text-white" size={22} />
				<span className="hidden text-[11px] leading-none text-white/80 sm:block">
					{s.account}
				</span>
			</LocalizedClientLink>
		);
	}

	return (
		<div
			className="relative flex flex-col items-center justify-center rounded-lg px-2.5 py-2 transition-colors hover:bg-white/10"
			onBlur={(e) => {
				if (!e.currentTarget.contains(e.relatedTarget as Node))
					later(false, 0);
			}}
			onFocus={() => later(true, 0)}
			onKeyDown={(e) => e.key === 'Escape' && later(false, 0)}
			onMouseEnter={() => later(true, 140)}
			onMouseLeave={() => later(false, 220)}
		>
			<LocalizedClientLink
				aria-expanded={open}
				aria-haspopup="menu"
				className="flex flex-col items-center gap-0.5"
				href="/user"
			>
				<ProfileIcon2 className="text-white" size={22} />
				<span className="text-[11px] text-white/80 hidden sm:block leading-none">
					{s.account}
				</span>
			</LocalizedClientLink>

			<Dropdown
				// Under the button, opening towards the icons beside it rather than over the search bar
				className="max-lg:!hidden !right-auto !left-0 !origin-top-left !bg-white !text-[#1B1B1B] !rounded-2xl !shadow-2xl !border !border-[#EDEAE3] top-full mt-2 !w-[220px] before:absolute before:-top-[7px] before:left-[30px] before:h-3 before:w-3 before:rotate-45 before:rounded-[2px] before:border-l before:border-t before:border-[#EDEAE3] before:bg-white"
				show={open}
			>
				<div className="py-2">
					{/* Header */}
					<div className="px-4 py-3 border-b border-[#EDEAE3]">
						<div
							className="text-[11px] font-semibold tracking-[0.14em] uppercase"
							style={{ color: '#432C63' }}
						>
							{s.yourAccount}
						</div>
						<div className="text-[13px] font-bold text-[#1B1B1B] mt-0.5 truncate">
							{user.first_name || user.email}
						</div>
					</div>

					{/* Nav links */}
					<nav className="py-1.5">
						{MENU_HREFS.map(({ key, href }) => (
							<LocalizedClientLink
								className="flex items-center justify-between px-4 py-2 text-[13.5px] text-[#1B1B1B] hover:bg-[#FAF8F5] hover:text-[#432C63] transition-colors"
								href={href}
								key={href}
							>
								{s[key]}
							</LocalizedClientLink>
						))}
						<LocalizedClientLink
							className="flex items-center justify-between px-4 py-2 text-[13.5px] text-[#1B1B1B] hover:bg-[#FAF8F5] hover:text-[#432C63] transition-colors"
							href="/user/messages"
						>
							{s.messages}
							{unreadCount > 0 && (
								<span
									className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
									style={{ backgroundColor: '#432C63' }}
								>
									{unreadCount}
								</span>
							)}
						</LocalizedClientLink>
					</nav>

					{/* Logout */}
					<div className="border-t border-[#EDEAE3] pt-1.5">
						<LogoutButton className="w-full text-left px-4 py-2 text-[13.5px] text-red-600 hover:bg-red-50 transition-colors rounded-b-2xl" />
					</div>
				</div>
			</Dropdown>
		</div>
	);
};
