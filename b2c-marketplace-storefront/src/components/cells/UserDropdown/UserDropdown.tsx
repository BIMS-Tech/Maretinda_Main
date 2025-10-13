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
import { ProfileIcon } from '@/icons';

export const UserDropdown = ({
	user,
}: {
	user: HttpTypes.StoreCustomer | null;
}) => {
	const [open, setOpen] = useState(false);

	const unreads = useUnreads();

	return (
		<div
			className="relative"
			onFocus={() => setOpen(true)}
			onMouseLeave={() => setOpen(false)}
			onMouseOver={() => setOpen(true)}
		>
			<LocalizedClientLink className="relative" href="/user">
				<ProfileIcon size={20} />
			</LocalizedClientLink>
			<Dropdown show={open}>
				{user ? (
					<div className="p-1">
						<div className="lg:w-[200px]">
							<h3 className="uppercase heading-xs border-b p-4">
								Your account
							</h3>
						</div>
						<NavigationItem href="/user/orders">
							Orders
						</NavigationItem>
						<NavigationItem
							className="relative"
							href="/user/messages"
						>
							Messages
							{Boolean(unreads?.length) && (
								<Badge className="absolute top-3 left-24 w-4 h-4 p-0">
									{unreads?.length}
								</Badge>
							)}
						</NavigationItem>
						<NavigationItem href="/user/returns">
							Returns
						</NavigationItem>
						<NavigationItem href="/user/addresses">
							Addresses
						</NavigationItem>
						<NavigationItem href="/user/reviews">
							Reviews
						</NavigationItem>
						<NavigationItem href="/user/wishlist">
							Wishlist
						</NavigationItem>
						<Divider />
						<NavigationItem href="/user/settings">
							Settings
						</NavigationItem>
						<LogoutButton />
					</div>
				) : (
					<div className="p-1">
						<NavigationItem href="/user">Login</NavigationItem>
						<NavigationItem href="/user/register">
							Register
						</NavigationItem>
					</div>
				)}
			</Dropdown>
		</div>
	);
};
