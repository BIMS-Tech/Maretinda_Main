'use client';

import type { HttpTypes } from '@medusajs/types';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { CartDropdownItem, Dropdown } from '@/components/molecules';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { usePrevious } from '@/hooks/usePrevious';
import { CartIcon2 } from '@/icons';
import { convertToLocale } from '@/lib/helpers/money';
import { useLanguage } from '@/providers/LanguageProvider';

const getItemCount = (cart: HttpTypes.StoreCart | null) => {
	return cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
};

export const CartDropdown = ({
	cart,
}: {
	cart: HttpTypes.StoreCart | null;
}) => {
	const { t } = useLanguage();
	const s = t.cart;

	const [open, setOpen] = useState(false);

	const previousItemCount = usePrevious(getItemCount(cart));
	const cartItemsCount = (cart && getItemCount(cart)) || 0;
	const pathname = usePathname();

	const total = convertToLocale({
		amount: cart?.item_total || 0,
		currency_code: cart?.currency_code || 'eur',
	});

	useEffect(() => {
		if (open) {
			const timeout = setTimeout(() => {
				setOpen(false);
			}, 2000);
			return () => clearTimeout(timeout);
		}
	}, [open]);

	useEffect(() => {
		if (
			previousItemCount !== undefined &&
			cartItemsCount > previousItemCount &&
			pathname.split('/')[2] !== 'cart'
		) {
			setOpen(true);
		}
	}, [cartItemsCount, previousItemCount]);

	return (
		<div
			className="relative flex flex-col items-center justify-center px-2.5 py-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
			onMouseLeave={() => setOpen(false)}
			onMouseOver={() => setOpen(true)}
		>
			<LocalizedClientLink href="/cart" className="flex flex-col items-center gap-0.5 relative">
				<span className="relative">
					<CartIcon2 className="text-white" />
					{Boolean(cartItemsCount) && (
						<span
							className="absolute -top-1.5 -right-1.5 text-[9.5px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
							style={{ backgroundColor: '#FFC533', color: '#432C63' }}
						>
							{cartItemsCount}
						</span>
					)}
				</span>
				<span className="text-[11px] text-white/80 hidden sm:block leading-none">{t.nav.cart}</span>
			</LocalizedClientLink>

			<Dropdown
				className="!bg-white !text-[#1B1B1B] !rounded-2xl !shadow-2xl !border !border-[#EDEAE3] top-full mt-1"
				show={open}
			>
				<div className="w-[360px] lg:w-[420px]">
					{/* Header */}
					<div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EDEAE3]">
						<div className="text-[11px] font-semibold tracking-[0.14em] uppercase" style={{ color: '#432C63' }}>
							{s.title}
						</div>
						{Boolean(cartItemsCount) && (
							<span className="text-[11px] text-[#737373]">
								{cartItemsCount} {cartItemsCount !== 1 ? s.items : s.item}
							</span>
						)}
					</div>

					<div className="p-4">
						{cartItemsCount ? (
							<>
								<div className="overflow-y-auto max-h-[320px] no-scrollbar space-y-1">
									{cart?.items?.map((item) => (
										<CartDropdownItem
											currency_code={cart.currency_code}
											item={item}
											key={item.id}
										/>
									))}
								</div>
								<div className="mt-4 pt-4 border-t border-[#EDEAE3]">
									<div className="flex justify-between items-center mb-4">
										<span className="text-[13px] text-[#404040]">{s.subtotal}</span>
										<span className="text-[16px] font-extrabold text-[#1B1B1B]">{total}</span>
									</div>
									<LocalizedClientLink href="/cart">
										<button
											className="w-full h-11 rounded-full text-[13.5px] font-bold text-white transition-opacity hover:opacity-90"
											style={{ backgroundColor: '#432C63' }}
										>
											{s.viewCart}
										</button>
									</LocalizedClientLink>
								</div>
							</>
						) : (
							<div className="py-6 text-center">
								<div className="text-[32px] mb-3">🛒</div>
								<div className="text-[14px] font-semibold text-[#1B1B1B] mb-1">{s.empty}</div>
								<div className="text-[12.5px] text-[#737373] mb-4">{s.emptyDesc}</div>
								<LocalizedClientLink href="/categories">
									<button
										className="h-10 px-6 rounded-full text-[13px] font-bold text-white transition-opacity hover:opacity-90"
										style={{ backgroundColor: '#432C63' }}
									>
										{s.exploreProducts}
									</button>
								</LocalizedClientLink>
							</div>
						)}
					</div>
				</div>
			</Dropdown>
		</div>
	);
};
