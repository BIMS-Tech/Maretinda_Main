'use client';

import type { HttpTypes } from '@medusajs/types';
import { useUnreads } from '@talkjs/react';
import { useState } from 'react';

import {
	Badge,
	Divider,
	LogoutButton,
	NavigationItem,
} from '@/components/atoms';
import { Dropdown } from '@/components/molecules';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { ProfileIcon2 } from '@/icons';
import Spinner from '@/icons/spinner';

export const UserDropdown = ({
	user,
}: {
	user: HttpTypes.StoreCustomer | null;
}) => {
	const [open, setOpen] = useState(false);
	const [isLoginClicked, setIsLoginClicked] = useState(false);
	const [isRegisterClicked, setIsRegisterClicked] = useState(false);

	const unreads = useUnreads();

	return (
		<div
			className="relative h-8 lg:h-[56px] flex items-center justify-center min-w-[30px] lg:min-w-[35px] xl:min-w-[45px]"
			onFocus={() => setOpen(true)}
			onMouseLeave={() => setOpen(false)}
			onMouseOver={() => setOpen(true)}
		>
			<LocalizedClientLink href={user ? '/user' : '/login'}>
				<ProfileIcon2 size={20} />
			</LocalizedClientLink>
			<Dropdown className="top-[32px] lg:top-[54px]" show={open}>
				{user ? (
					<div className="p-1 min-w-60 px-4 py-2">
						<div className="lg:w-[200px]">
							<h3 className="uppercase heading-xs border-b p-4">
								Your account
							</h3>
						</div>
						<NavigationItem
							className="!font-semibold py-2 relative label-md capitalize"
							href="/user/orders"
						>
							Orders
						</NavigationItem>
						<NavigationItem
							className="!font-semibold py-2 relative label-md capitalize"
							href="/user/messages"
						>
							Messages
							{Boolean(unreads?.length) && (
								<Badge className="absolute top-3 left-24 w-4 h-4 p-0">
									{unreads?.length}
								</Badge>
							)}
						</NavigationItem>
						<NavigationItem
							className="!font-semibold py-2 label-md capitalize"
							href="/user/returns"
						>
							Returns
						</NavigationItem>
						<NavigationItem
							className="!font-semibold py-2 label-md capitalize"
							href="/user/addresses"
						>
							Addresses
						</NavigationItem>
						<NavigationItem
							className="!font-semibold py-2 label-md capitalize"
							href="/user/reviews"
						>
							Reviews
						</NavigationItem>
						<NavigationItem
							className="!font-semibold py-2 label-md capitalize"
							href="/user/wishlist"
						>
							Wishlist
						</NavigationItem>
						<Divider />
						<NavigationItem
							className="!font-semibold py-2 label-md capitalize"
							href="/user/settings"
						>
							Settings
						</NavigationItem>
						<LogoutButton className="!font-semibold py-2 relative label-md capitalize" />
					</div>
				) : (
					<div className="p-1 min-w-60 px-4 py-7">
						<div className="px-3">
							<NavigationItem
								className="bg-tertiary capitalize text-tertiary label-lg rounded-full justify-center"
								href="/login"
								onClick={() => {
									setIsLoginClicked(true);
									setTimeout(() => {
										setIsLoginClicked(false);
									}, 300);
								}}
							>
								{isLoginClicked ? <Spinner /> : 'Sign In'}
							</NavigationItem>
							<NavigationItem
								className="justify-center capitalize label-lg"
								href="/register"
								onClick={() => {
									setIsRegisterClicked(true);
									setTimeout(() => {
										setIsRegisterClicked(false);
									}, 300);
								}}
							>
								{isRegisterClicked ? <Spinner /> : 'Register'}
							</NavigationItem>
						</div>

						<hr className="border-black/25 my-1" />

						<div className="flex flex-col gap-2.5 pt-4">
							<NavigationItem
								className="py-0 justify-start label-md capitalize !font-semibold"
								href="/help-center"
							>
								Help Center
							</NavigationItem>
							<NavigationItem
								className="py-0 justify-start label-md capitalize !font-semibold"
								href="/refund-policy"
							>
								Return & Refund Policy
							</NavigationItem>
							<NavigationItem
								className="py-0 justify-start label-md capitalize !font-semibold"
								href="/report"
							>
								Report
							</NavigationItem>
						</div>
					</div>
				)}
			</Dropdown>
		</div>
	);
};
