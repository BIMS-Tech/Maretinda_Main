import type { HttpTypes } from '@medusajs/types';
import clsx from 'clsx';
import Image from 'next/image';

import { Avatar, Button, StarRating } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { getImageUrl } from '@/lib/helpers/get-image-url';
import { convertToLocale } from '@/lib/helpers/money';
import type { SellerProps } from '@/types/seller';
import type { Wishlist } from '@/types/wishlist';

import { DeleteWishlistButton } from '../WishlistButton/DeleteWishlistButton';

interface StoreProduct extends HttpTypes.StoreProduct {
	seller?: SellerProps;
	reviews?: any[];
}

export const WishlistItem = ({
	product,
	api_product,
	wishlist,
	user,
}: {
	product: HttpTypes.StoreProduct & {
		calculated_amount: number;
		currency_code: string;
	};
	api_product?: StoreProduct | null;
	wishlist: Wishlist[];
	user?: HttpTypes.StoreCustomer | null;
}) => {
	const price = convertToLocale({
		amount: product.calculated_amount,
		currency_code: product.currency_code,
	});

	// Calculate real product ratings
	const productReviews = api_product?.reviews?.filter((rev: any) => rev !== null && rev.reference === 'product') || [];
	const reviewCount = productReviews.length;
	const averageRating = reviewCount > 0
		? productReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount
		: 0;

	return (
		<div
			className={clsx(
				'group relative border rounded-sm overflow-hidden flex flex-col justify-between w-[250px] lg:w-[370px]',
			)}
		>
			<div className="relative w-full h-full bg-primary aspect-square max-h-[220px]">
				<div className="absolute right-[14px] top-[14px] z-10 cursor-pointer">
					<DeleteWishlistButton
						productId={product.id}
						user={user}
						wishlist={wishlist}
					/>
				</div>
				<LocalizedClientLink href={`/products/${product.handle}`}>
					<div className="overflow-hidden rounded-t-sm w-full h-full flex justify-center align-center ">
						{product.thumbnail ? (
							<Image
								alt={product.title}
								className="object-cover aspect-square max-h-[220px] w-full object-center h-full transition-all duration-300"
								height={220}
								priority
								src={getImageUrl(
									decodeURIComponent(product.thumbnail),
								)}
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
			<div className="p-4">
				<LocalizedClientLink href={`/products/${product.handle}`}>
					<div className="flex flex-col gap-2 mt-2">
						<h3 className="heading-sm truncate font-poppins text-black">
							{product.title}
						</h3>
						<div className="flex items-center gap-3 font-poppins font-medium">
							<span className="font-medium text-red-500">
								{price}
							</span>
							{/* TODO: Implement old price */}
							<span className="font-medium text-gray-500 line-through">
								$160
							</span>
						</div>
					{reviewCount > 0 && (
						<div className="flex items-center gap-2">
							<StarRating rate={averageRating} starSize={16} />
							<span className="text-md text-black/60 !font-medium">
								({reviewCount})
							</span>
						</div>
					)}

						<div className="text-[#065f46] font-medium text-[14px]">
							Available in stock
						</div>
						<div className="flex items-center gap-2.5 mt-2">
							<Avatar
								className="rounded-full h-10 w-10"
								initials="M"
								size="large"
								src={
									api_product?.seller?.photo ||
									'/talkjs-placeholder.jpg'
								}
							/>
							<p className="label-lg text-black">
								{api_product?.seller?.name}
							</p>
						</div>
					</div>
				</LocalizedClientLink>
				<LocalizedClientLink
					className="absolute group-hover:block hidden h-auto lg:h-[40px] w-[calc(100%-32px)] -mx-[calc(50%-16px)] left-1/2 bottom-4 z-10"
					href={`/products/${product.handle}`}
				>
					{/* TODO: Implement add to cart */}
					<Button className="rounded-sm bg-action text-action-on-primary !font-medium h-auto lg:h-[40px] w-full">
						Add to Cart
					</Button>
				</LocalizedClientLink>
			</div>
		</div>
	);
};
