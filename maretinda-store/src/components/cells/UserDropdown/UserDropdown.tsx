'use client';

import type { HttpTypes } from '@medusajs/types';
import { useEffect, useState } from 'react';

import { LogoutButton } from '@/components/atoms';
import { Dropdown } from '@/components/molecules';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { ProfileIcon2 } from '@/icons';
import Spinner from '@/icons/spinner';
import { useLanguage } from '@/providers/LanguageProvider';

type NavKey = 'orders' | 'returns' | 'addresses' | 'reviews' | 'wishlist' | 'settings';

const MENU_HREFS: { key: NavKey; href: string }[] = [
	{ key: 'orders', href: '/user/orders' },
	{ key: 'returns', href: '/user/returns' },
	{ key: 'addresses', href: '/user/addresses' },
	{ key: 'reviews', href: '/user/reviews' },
	{ key: 'wishlist', href: '/user/wishlist' },
	{ key: 'settings', href: '/user/settings' },
];

export const UserDropdown = ({
	user,
}: {
	user: HttpTypes.StoreCustomer | null;
}) => {
	const { t } = useLanguage();
	const s = t.nav;

	const [open, setOpen] = useState(false);
	const [isLoginClicked, setIsLoginClicked] = useState(false);
	const [isRegisterClicked, setIsRegisterClicked] = useState(false);

	const [unreadCount, setUnreadCount] = useState(0)

	useEffect(() => {
		if (!user) return
		fetch('/api/chat')
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => { if (data?.unread) setUnreadCount(Number(data.unread)) })
			.catch(() => {})
	}, [user])

	return (
		<div
			className="relative flex flex-col items-center justify-center px-2.5 py-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
			onFocus={() => setOpen(true)}
			onMouseLeave={() => setOpen(false)}
			onMouseOver={() => setOpen(true)}
		>
			<LocalizedClientLink href={user ? '/user' : '/login'} className="flex flex-col items-center gap-0.5">
				<ProfileIcon2 size={22} className="text-white" />
				<span className="text-[11px] text-white/80 hidden sm:block leading-none">{s.account}</span>
			</LocalizedClientLink>

			<Dropdown
				className="!bg-white !text-[#1B1B1B] !rounded-2xl !shadow-2xl !border !border-[#EDEAE3] top-full mt-1 !w-[220px]"
				show={open}
			>
				{user ? (
					<div className="py-2">
						{/* Header */}
						<div className="px-4 py-3 border-b border-[#EDEAE3]">
							<div className="text-[11px] font-semibold tracking-[0.14em] uppercase" style={{ color: '#432C63' }}>
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
									key={href}
									href={href}
									className="flex items-center justify-between px-4 py-2 text-[13.5px] text-[#1B1B1B] hover:bg-[#FAF8F5] hover:text-[#432C63] transition-colors"
								>
									{s[key]}
								</LocalizedClientLink>
							))}
							{user && (
								<LocalizedClientLink
									href="/user/messages"
									className="flex items-center justify-between px-4 py-2 text-[13.5px] text-[#1B1B1B] hover:bg-[#FAF8F5] hover:text-[#432C63] transition-colors"
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
							)}
						</nav>

						{/* Logout */}
						<div className="border-t border-[#EDEAE3] pt-1.5">
							<LogoutButton className="w-full text-left px-4 py-2 text-[13.5px] text-red-600 hover:bg-red-50 transition-colors rounded-b-2xl" />
						</div>
					</div>
				) : (
					<div className="py-3 px-4">
						<div className="text-[11px] font-semibold tracking-[0.14em] uppercase mb-3" style={{ color: '#432C63' }}>
							{s.welcome}
						</div>
						<LocalizedClientLink
							href="/login"
							className="block w-full h-10 rounded-full text-[13.5px] font-bold text-center flex items-center justify-center transition-opacity hover:opacity-90 mb-2"
							style={{ backgroundColor: '#432C63', color: 'white' }}
							onClick={() => { setIsLoginClicked(true); setTimeout(() => setIsLoginClicked(false), 300); }}
						>
							{isLoginClicked ? <Spinner /> : s.signIn}
						</LocalizedClientLink>
						<LocalizedClientLink
							href="/register"
							className="block w-full h-10 rounded-full text-[13.5px] font-bold text-center flex items-center justify-center border transition-colors hover:border-[#432C63] hover:text-[#432C63]"
							style={{ borderColor: 'rgba(27,27,27,0.15)', color: '#1B1B1B' }}
							onClick={() => { setIsRegisterClicked(true); setTimeout(() => setIsRegisterClicked(false), 300); }}
						>
							{isRegisterClicked ? <Spinner /> : s.register}
						</LocalizedClientLink>

						<div className="border-t border-[#EDEAE3] mt-3 pt-3 flex flex-col gap-1">
							{[
								{ label: s.helpCenter, href: '/help-center' },
								{ label: s.refundPolicy, href: '/refund-policy' },
							].map(({ label, href }) => (
								<LocalizedClientLink
									key={href}
									href={href}
									className="text-[12.5px] text-[#404040] hover:text-[#432C63] transition-colors py-0.5"
								>
									{label}
								</LocalizedClientLink>
							))}
						</div>
					</div>
				)}
			</Dropdown>
		</div>
	);
};
