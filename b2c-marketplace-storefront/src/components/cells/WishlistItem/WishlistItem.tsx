import type { HttpTypes } from '@medusajs/types';
import clsx from 'clsx';
import Image from 'next/image';

import { Button } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { convertToLocale } from '@/lib/helpers/money';
import type { Wishlist } from '@/types/wishlist';

import { WishlistButton } from '../WishlistButton/WishlistButton';

export const WishlistItem = ({
	product,
	wishlist,
	user,
}: {
	product: HttpTypes.StoreProduct & {
		calculated_amount: number;
		currency_code: string;
	};
	wishlist: Wishlist[];
	user?: HttpTypes.StoreCustomer | null;
}) => {
	const price = convertToLocale({
		amount: product.calculated_amount,
		currency_code: product.currency_code,
	});

	return (
		<div
			className={clsx(
				'relative group border rounded-sm flex flex-col justify-between p-1 w-[250px] lg:w-[370px]',
			)}
		>
			<div className="relative w-full h-full bg-primary aspect-square">
				<div className="absolute right-3 top-3 z-10 cursor-pointer">
					<WishlistButton
						productId={product.id}
						user={user}
						wishlist={wishlist}
					/>
				</div>
				<LocalizedClientLink href={`/products/${product.handle}`}>
					<div className="overflow-hidden rounded-sm w-full h-full flex justify-center align-center ">
						{product.thumbnail ? (
							<Image
								alt={product.title}
								className="object-cover aspect-square w-full object-center h-full lg:group-hover:-mt-14 transition-all duration-300 rounded-xs"
								height={360}
								priority
								src={decodeURIComponent(product.thumbnail)}
								width={360}
							/>
						) : (
							<Image
								alt="Product placeholder"
								className="flex margin-auto w-[100px] h-auto"
								height={100}
								src="/images/placeholder.svg"
								width={100}
							/>
						)}
					</div>
				</LocalizedClientLink>
				<LocalizedClientLink href={`/products/${product.handle}`}>
					<Button className="absolute rounded-sm bg-action text-action-on-primary h-auto lg:h-[48px] lg:group-hover:block hidden w-full uppercase bottom-1 z-10">
						See More
					</Button>
				</LocalizedClientLink>
			</div>
			<LocalizedClientLink href={`/products/${product.handle}`}>
				<div className="flex justify-between p-4">
					<div className="w-full">
						<h3 className="heading-sm truncate">{product.title}</h3>
						<div className="flex items-center gap-2 mt-2">
							{price}
						</div>
					</div>
				</div>
			</LocalizedClientLink>
		</div>
	);
};
