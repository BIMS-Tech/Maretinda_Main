import type { HttpTypes } from '@medusajs/types';
import type { BaseHit, Hit } from 'instantsearch.js';
import Image from 'next/image';

import { WishlistButton } from '@/components/cells/WishlistButton/WishlistButton';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { getImageUrl } from '@/lib/helpers/get-image-url';
import { getProductPrice } from '@/lib/helpers/get-product-price';
import type { SellerProps } from '@/types/seller';
import type { Wishlist } from '@/types/wishlist';

interface StoreProduct extends HttpTypes.StoreProduct {
	seller?: SellerProps;
	reviews?: any[];
}

export const ProductCard = ({
	product,
	api_product,
	user,
	wishlist,
}: {
	product: Hit<HttpTypes.StoreProduct> | Partial<Hit<BaseHit>>;
	api_product?: StoreProduct | null;
	user: HttpTypes.StoreCustomer | null;
	wishlist: Wishlist[];
}) => {
	if (!api_product) return null;

	const { cheapestPrice } = getProductPrice({
		product: api_product as StoreProduct,
	});

	const isDiscounted =
		cheapestPrice?.calculated_price !== cheapestPrice?.original_price;

	const orig = Number.parseInt(cheapestPrice?.original_price as string, 10);
	const calc = Number.parseInt(cheapestPrice?.calculated_price as string, 10);
	const discountPct =
		isDiscounted && orig > 0
			? Math.round(((orig - calc) / orig) * 100)
			: 0;

	const thumbnail = product.thumbnail
		? getImageUrl(decodeURIComponent(product.thumbnail as string))
		: null;

	return (
		<div className="group relative bg-white rounded-2xl overflow-hidden border border-black/[0.07] hover:shadow-[0_8px_40px_rgba(67,44,99,0.13)] transition-all duration-300">
			{/* Image area */}
			<LocalizedClientLink href={`/products/${product.handle}`}>
				<div className="relative w-full aspect-[4/5] overflow-hidden bg-[#F5F4F7]">
					{thumbnail ? (
						<Image
							alt={product.title as string}
							className="object-cover w-full h-full group-hover:scale-[1.04] transition-transform duration-500 ease-out"
							fill
							priority
							sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 25vw"
							src={thumbnail}
						/>
					) : (
						<Image
							alt="Product placeholder"
							className="object-cover"
							fill
							sizes="300px"
							src="/images/placeholder.svg"
						/>
					)}

					{/* Discount badge */}
					{discountPct > 0 && (
						<span className="absolute top-3 left-3 z-10 bg-[#432C63] text-white text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full">
							−{discountPct}%
						</span>
					)}

					{/* Add to cart — slides up on hover */}
					<div className="absolute inset-x-3 bottom-3 z-10 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 ease-out">
						<span className="block w-full text-center bg-[#432C63] text-white text-[12.5px] font-semibold rounded-full py-2.5 shadow-lg">
							Add to cart
						</span>
					</div>
				</div>
			</LocalizedClientLink>

			{/* Wishlist button — always visible */}
			<div className="absolute top-3 right-3 z-10">
				<WishlistButton
					className="!w-9 !h-9 !p-0 rounded-full bg-white shadow-sm border-0 flex items-center justify-center hover:shadow-md transition-shadow flex-shrink-0"
					productId={product.id}
					user={user}
					wishlist={wishlist}
				/>
			</div>

			{/* Content */}
			<div className="px-3.5 pt-3 pb-4">
				{/* Verified Seller */}
				<div className="flex items-center gap-1.5 mb-1.5">
					<svg
						fill="#432C63"
						height="11"
						viewBox="0 0 24 24"
						width="11"
					>
						<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
					</svg>
					<span className="text-[10px] font-bold text-gray-400 tracking-[0.1em] uppercase">
						Verified Seller
					</span>
				</div>

				{/* Title */}
				<LocalizedClientLink href={`/products/${product.handle}`}>
					<h3 className="text-[13.5px] font-bold text-gray-900 leading-snug line-clamp-2 min-h-[2.5em] mb-2.5 group-hover:text-[#432C63] transition-colors duration-150">
						{product.title as string}
					</h3>
				</LocalizedClientLink>

				{/* Price */}
				<LocalizedClientLink
					className="flex items-center gap-2"
					href={`/products/${product.handle}`}
				>
					<span className="text-[14px] font-bold text-[#432C63]">
						{cheapestPrice?.calculated_price || 'View price'}
					</span>
					{isDiscounted && cheapestPrice?.original_price && (
						<span className="text-[11.5px] text-gray-400 line-through font-medium">
							{cheapestPrice.original_price}
						</span>
					)}
				</LocalizedClientLink>
			</div>
		</div>
	);
};
