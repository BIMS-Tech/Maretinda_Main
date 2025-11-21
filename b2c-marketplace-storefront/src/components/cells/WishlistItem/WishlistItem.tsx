import type { HttpTypes } from '@medusajs/types';
import clsx from 'clsx';
import Image from 'next/image';

import { Button } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { convertToLocale } from '@/lib/helpers/money';
import { getImageUrl } from '@/lib/helpers/get-image-url';
import type { Wishlist } from '@/types/wishlist';
import { FaStar } from "react-icons/fa";

import { DeleteWishlistButton } from "../WishlistButton/DeleteWishlistButton";

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
				"relative border rounded-sm flex flex-col justify-between p-[14px] w-[250px] lg:w-[370px]",
			)}
		>
			<div className="relative w-full h-full bg-primary aspect-square">
				<div className="absolute right-[14px] top-[14px] z-10 cursor-pointer">
					<DeleteWishlistButton
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
								className="object-cover aspect-square w-full object-center h-full transition-all duration-300 rounded-xs"
								height={360}
								priority
								src={getImageUrl(decodeURIComponent(product.thumbnail))}
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
			</div>
			<LocalizedClientLink href={`/products/${product.handle}`}>
				<div className="flex flex-col gap-2 mt-4">
					<h3 className="heading-sm truncate font-poppins text-black">
						{product.title}
					</h3>
					<div className="flex items-center gap-3 font-poppins font-medium">
						<span className="text-[##DB4444]">{price}</span>
						{/* TODO: Implement old price */}
						<span className="text-neutral-400 line-through">$160</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="flex items-center">
							<FaStar color="#FFAD33" />
							<FaStar color="#FFAD33" />
							<FaStar color="#FFAD33" />
							<FaStar color="#FFAD33" />
							<FaStar color="#FFAD33" />
						</div>
						<span className="font-poppins font-semibold">(63)</span>
					</div>
					<div className="text-[#065f46] font-medium text-[14px]">
						Available in stock
					</div>
				</div>
			</LocalizedClientLink>
			<LocalizedClientLink href={`/products/${product.handle}`}>
				{/* TODO: Implement add to cart */}
				<Button className="rounded-sm bg-action text-action-on-primary h-auto lg:h-[48px] w-full bottom-1 z-10 mt-4">
					Add to Cart
				</Button>
			</LocalizedClientLink>
		</div>
	);
};
