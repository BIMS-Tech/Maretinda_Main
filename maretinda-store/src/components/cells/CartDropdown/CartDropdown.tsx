'use client';

import type { HttpTypes } from '@medusajs/types';
import { useEffect, useRef, useState } from 'react';

import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { CartDrawer } from '@/components/organisms/CartDrawer/CartDrawer';
import { CartIcon2 } from '@/icons';
import { openCartDrawer } from '@/lib/cart-feedback';
import { isPlainClick } from '@/lib/view-transition';
import { useLanguage } from '@/providers/LanguageProvider';

/** The header's cart: how many are in it, and the drawer it opens. */
export const CartDropdown = ({ cart }: { cart: HttpTypes.StoreCart | null }) => {
	const { t } = useLanguage();
	const count = cart?.items?.reduce((n, item) => n + item.quantity, 0) ?? 0;
	const before = useRef(count);
	const [bump, setBump] = useState(0);

	useEffect(() => {
		if (count > before.current) setBump((n) => n + 1);
		before.current = count;
	}, [count]);

	return (
		<>
			<LocalizedClientLink
				aria-label={`${t.nav.cart}${count ? `, ${count}` : ''}`}
				className="relative flex flex-col items-center justify-center gap-0.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-white/10"
				data-cart-target=""
				data-testid="header-cart"
				href="/cart"
				onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
					if (!isPlainClick(e)) return;
					e.preventDefault();
					openCartDrawer();
				}}
				prefetch={false}
			>
				<span className="relative">
					<CartIcon2 className="text-white" />
					{count > 0 && (
						<span
							className={`absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#FFC533] px-1 text-[10px] font-bold tabular-nums text-[#432C63] ${bump ? 'badge-bump' : 'pop-in'}`}
							key={bump}
						>
							{count > 99 ? '99+' : count}
						</span>
					)}
				</span>
				<span className="hidden text-[11px] leading-none text-white/80 sm:block">{t.nav.cart}</span>
			</LocalizedClientLink>
			<CartDrawer cart={cart} />
		</>
	);
};
