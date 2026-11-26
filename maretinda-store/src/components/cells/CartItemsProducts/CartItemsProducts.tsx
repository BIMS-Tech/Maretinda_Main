'use client';

import type { HttpTypes } from '@medusajs/types';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import Image from 'next/image';

import { AnimatedNumber, EASE_OUT, SPRING_SOFT } from '@/components/motion';
import { DeleteCartItemButton } from '@/components/molecules/DeleteCartItemButton/DeleteCartItemButton';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { UpdateCartItemButton } from '@/components/molecules/UpdateCartItemButton/UpdateCartItemButton';
import { cardImage, groundOf } from '@/lib/helpers/card-image';
import { convertToLocale } from '@/lib/helpers/money';

type Line = HttpTypes.StoreCartLineItem & { sellerName?: string };

export const CartItemsProducts = ({
	products,
	currency_code,
	delete_item = true,
	change_quantity = true,
}: {
	products: Line[];
	currency_code: string;
	delete_item?: boolean;
	change_quantity?: boolean;
}) => {
	const money = (amount: number) => convertToLocale({ amount, currency_code });
	return (
		<ul className="relative w-full divide-y divide-[#F0ECF4]">
			<AnimatePresence initial={false} mode="popLayout">
				{products.map((line) => (
					<m.li
						animate={{ opacity: 1, x: 0 }}
						className="bg-white py-5 first:pt-0 last:pb-0"
						exit={{ opacity: 0, scale: 0.96, x: -40, transition: { duration: 0.25, ease: EASE_OUT } }}
						initial={{ opacity: 0, x: 24 }}
						key={line.id}
						layout
						transition={SPRING_SOFT}
					>
						<div className="flex gap-4 sm:gap-5">
							<LocalizedClientLink className="group shrink-0" href={`/products/${line.product_handle}`}>
								<span
									className="relative block h-[84px] w-[84px] overflow-hidden rounded-[18px] sm:h-[104px] sm:w-[104px]"
									style={{ backgroundColor: groundOf(line.product_id ?? line.id) }}
								>
									<Image
										alt={line.title || 'Product'}
										className="object-contain p-2.5 mix-blend-multiply transition-transform duration-500 ease-soft group-hover:scale-105"
										fill
										sizes="104px"
										src={cardImage(line.thumbnail) || '/images/placeholder.svg'}
									/>
								</span>
							</LocalizedClientLink>
							<div className="flex min-w-0 flex-1 flex-col">
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<LocalizedClientLink href={`/products/${line.product_handle}`}>
											<h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-[#1B1B1B]">
												<span className="link-line">{line.product_title || line.title || line.subtitle}</span>
											</h3>
										</LocalizedClientLink>
										{line.variant_title && !/default/i.test(line.variant_title) && <p className="mt-0.5 text-[12.5px] text-[#8A8493]">{line.variant_title}</p>}
										{line.sellerName && (
											<p className="mt-0.5 text-[12.5px] text-[#8A8493]">
												Sold by <span className="font-semibold text-[#404040]">{line.sellerName}</span>
											</p>
										)}
									</div>
									{delete_item && <DeleteCartItemButton id={line.id} />}
								</div>
								<div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
									<div className="flex items-center gap-4">
										{change_quantity ? <UpdateCartItemButton lineItemId={line.id} quantity={line.quantity} /> : <span className="text-[13px] font-medium">× {line.quantity}</span>}
										<span className="text-[13px] text-[#8A8493]">{money(line.unit_price || 0)} each</span>
									</div>
									<AnimatedNumber className="text-[16px] font-bold text-[#432C63]" format={money} value={line.subtotal || 0} />
								</div>
							</div>
						</div>
					</m.li>
				))}
			</AnimatePresence>
		</ul>
	);
};
