'use client';

import type { HttpTypes } from '@medusajs/types';
import type { BaseHit, Hit } from 'instantsearch.js';
import { truncate } from 'lodash';
import Image from 'next/image';

import { Avatar, StarRating } from '@/components/atoms';
import { WishlistButton } from '@/components/cells/WishlistButton/WishlistButton';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { getImageUrl } from '@/lib/helpers/get-image-url';
import { getProductPrice } from '@/lib/helpers/get-product-price';
import { cn } from '@/lib/utils';
import type { Wishlist } from '@/types/wishlist';

interface StoreProduct extends HttpTypes.StoreProduct {
	seller?: { name?: string; photo?: string };
	reviews?: any[];
}

export const ProductBigCard = ({
	product,
	api_product,
	id,
	user,
	wishlist,
}: {
	product: Hit<HttpTypes.StoreProduct> | Partial<Hit<BaseHit>>;
	api_product?: StoreProduct | null;
	id: number;
	user: HttpTypes.StoreCustomer | null;
	wishlist: Wishlist[];
}) => {
	if (!api_product) return null;

	const { cheapestPrice } = getProductPrice({
		product: api_product as HttpTypes.StoreProduct,
	});

	const isDiscounted =
		cheapestPrice?.calculated_price !== cheapestPrice?.original_price;
	const origNum = cheapestPrice?.original_price_number ?? 0;
	const calcNum = cheapestPrice?.calculated_price_number ?? 0;
	const discountPct =
		isDiscounted && origNum > 0
			? Math.round(((origNum - calcNum) / origNum) * 100)
			: 0;

	const productReviews =
		api_product.reviews?.filter(
			(r: any) => r !== null && r.reference === 'product',
		) ?? [];
	const reviewCount = productReviews.length;
	const avgRating =
		reviewCount > 0
			? productReviews.reduce((s: number, r: any) => s + r.rating, 0) /
			  reviewCount
			: 0;

	const seller = api_product.seller;
	const sellerName = seller?.name || 'Verified Seller';
	const sellerPhoto: string | undefined = seller?.photo ? seller.photo : undefined;

	const thumbnail = product.thumbnail
		? getImageUrl(decodeURIComponent(product.thumbnail as string))
		: null;

	const description = truncate((product as any).description ?? '', {
		length: 160,
		omission: '…',
		separator: ' ',
	});

	return (
		<div className={cn(id === 0 ? 'pb-3' : 'py-3')}>
			<div className="group bg-white rounded-2xl border border-black/[0.06] hover:shadow-[0_4px_24px_rgba(67,44,99,0.10)] hover:border-[#432C63]/20 transition-all duration-300 flex flex-col sm:flex-row overflow-hidden">

				{/* Image */}
				<LocalizedClientLink
					className="relative w-full sm:w-[200px] shrink-0 aspect-square sm:aspect-auto bg-[#F7F6F9]"
					href={`/products/${product.handle}`}
				>
					{thumbnail ? (
						<Image
							alt={product.title as string}
							className="object-contain p-5 group-hover:scale-[1.04] transition-transform duration-400 ease-out"
							fill
							priority
							sizes="200px"
							src={thumbnail}
						/>
					) : (
						<Image
							alt="Product placeholder"
							className="object-contain p-5"
							fill
							sizes="200px"
							src="/images/placeholder.svg"
						/>
					)}
					{discountPct > 0 && (
						<span className="absolute top-3 left-3 z-10 bg-[#432C63] text-white text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full shadow-sm">
							−{discountPct}%
						</span>
					)}
				</LocalizedClientLink>

				{/* Content */}
				<div className="flex-1 flex flex-col px-5 py-4 min-w-0">
					{/* Title */}
					<LocalizedClientLink href={`/products/${product.handle}`}>
						<h3 className="text-[16px] font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-[#432C63] transition-colors duration-150">
							{product.title as string}
						</h3>
					</LocalizedClientLink>

					{/* Price */}
					<div className="flex items-center gap-2 mt-1.5">
						<span className="text-[15px] font-bold text-[#432C63]">
							{cheapestPrice?.calculated_price || 'View price'}
						</span>
						{isDiscounted && cheapestPrice?.original_price && (
							<span className="text-[13px] text-gray-400 line-through font-medium">
								{cheapestPrice.original_price}
							</span>
						)}
					</div>

					{/* Rating */}
					{reviewCount > 0 && (
						<div className="flex items-center gap-1.5 mt-1.5">
							<StarRating rate={avgRating} starSize={13} />
							<span className="text-[12px] text-gray-500">
								({reviewCount})
							</span>
						</div>
					)}

					{/* Description */}
					{description && (
						<p className="mt-2.5 text-[13px] text-gray-500 leading-relaxed line-clamp-2">
							{description}
						</p>
					)}

					{/* Footer: seller + actions */}
					<div className="mt-auto pt-4 flex items-center justify-between gap-3 flex-wrap">
						{/* Seller */}
						<div className="flex items-center gap-2 min-w-0">
							<Avatar
								className="rounded-full h-7 w-7 shrink-0"
								initials={sellerName.charAt(0).toUpperCase()}
								size="small"
								src={sellerPhoto}
							/>
							<span className="text-[12px] font-semibold text-gray-700 truncate">
								{sellerName}
							</span>
						</div>

						{/* Actions */}
						<div className="flex items-center gap-2 shrink-0">
							<WishlistButton
								className="!w-8 !h-8 !p-0 rounded-full bg-gray-50 border border-black/[0.08] flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0"
								productId={product.id}
								user={user}
								wishlist={wishlist}
							/>
							<LocalizedClientLink href={`/products/${product.handle}`}>
								<span className="inline-flex items-center h-9 px-5 rounded-full bg-[#432C63] text-white text-[12.5px] font-semibold hover:opacity-90 transition-opacity cursor-pointer">
									View product
								</span>
							</LocalizedClientLink>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
