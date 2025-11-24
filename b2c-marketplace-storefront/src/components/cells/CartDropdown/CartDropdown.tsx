'use client';

import type { HttpTypes } from '@medusajs/types';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Badge, Button } from '@/components/atoms';
import { CartDropdownItem, Dropdown } from '@/components/molecules';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { usePrevious } from '@/hooks/usePrevious';
import { CartIcon2 } from '@/icons';
import { convertToLocale } from '@/lib/helpers/money';

const getItemCount = (cart: HttpTypes.StoreCart | null) => {
	return cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
};

export const CartDropdown = ({
	cart,
}: {
	cart: HttpTypes.StoreCart | null;
}) => {
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
			className="relative h-8 lg:h-[56px] flex justify-center items-center min-w-[30px] md:min-w-[35px] xl:min-w-[45px]"
			onMouseLeave={() => setOpen(false)}
			onMouseOver={() => setOpen(true)}
		>
			<LocalizedClientLink className="relative" href="/cart">
				<CartIcon2 />
				{Boolean(cartItemsCount) && (
					<Badge className="absolute -top-2 -right-2 w-4 h-4 p-0">
						{cartItemsCount}
					</Badge>
				)}
			</LocalizedClientLink>
			<Dropdown className="top-[32px] lg:top-[54px]" show={open}>
				<div className="lg:w-[460px] shadow-lg">
					<h3 className="uppercase heading-md border-b p-4">
						Shopping cart
					</h3>
					<div className="p-4">
						{cartItemsCount ? (
							<div>
								<div className="overflow-y-scroll max-h-[360px] no-scrollbar">
									{cart?.items?.map((item) => (
										<CartDropdownItem
											currency_code={cart.currency_code}
											item={item}
											key={item.id}
										/>
									))}
								</div>
								<div className="pt-4">
									<div className="text-secondary flex justify-between items-center">
										Total{' '}
										<p className="label-xl text-primary">
											{total}
										</p>
									</div>
									<LocalizedClientLink href="/cart">
										<Button className="w-full mt-4 py-3">
											Go to cart
										</Button>
									</LocalizedClientLink>
								</div>
							</div>
						) : (
							<div className="px-8">
								<h4 className="heading-md uppercase text-center">
									Your shopping cart is empty
								</h4>
								<p className="text-lg text-center py-4">
									Are you looging for inspiration?
								</p>
								<LocalizedClientLink href="/categories">
									<Button className="w-full py-3">
										Explore Home Page
									</Button>
								</LocalizedClientLink>
							</div>
						)}
					</div>
				</div>
			</Dropdown>
		</div>
	);
};
