import type { HttpTypes } from '@medusajs/types';
import clsx from 'clsx';
import type { BaseHit, Hit } from 'instantsearch.js';
import Image from 'next/image';

import { Avatar, StarRating } from '@/components/atoms';
import { WishlistButton } from '@/components/cells/WishlistButton/WishlistButton';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { getImageUrl } from '@/lib/helpers/get-image-url';
import { getProductPrice } from '@/lib/helpers/get-product-price';
import type { SellerProps } from '@/types/seller';
import type { Wishlist } from '@/types/wishlist';

import ProductImageCarousel from './ProductImageCarousel';

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
		product: api_product! as StoreProduct,
	});

	const productReviews =
		api_product.reviews?.filter(
			(rev: any) => rev !== null && rev.reference === 'product',
		) || [];
	const reviewCount = productReviews.length;
	const averageRating =
		reviewCount > 0
			? productReviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
				reviewCount
			: 0;

	const isDiscounted =
		cheapestPrice?.calculated_price !== cheapestPrice?.original_price;
	let discountPct = 0;
	if (isDiscounted) {
		const orig = Number.parseInt(cheapestPrice?.original_price as string, 10);
		const calc = Number.parseInt(cheapestPrice?.calculated_price as string, 10);
		discountPct = Math.round(((orig - calc) / orig) * 100);
	}

	const imageGallery = product.images.map(
		(image: { id: string; name: string; url: string }) => ({
			...image,
			url: getImageUrl(image.url),
		}),
	);

	return (
		<div className="w-full sm:max-w-[300px]">
			<div className={clsx(
				'group relative bg-white rounded-2xl overflow-hidden flex flex-col',
				'border border-black/[0.07] hover:border-[#432C63]/20',
				'hover:shadow-[0_8px_32px_rgba(67,44,99,0.12)]',
				'transition-all duration-300',
			)}>

				{/* ── Image area ── */}
				<LocalizedClientLink href={`/products/${product.handle}`}>
					<div className="relative w-full aspect-square overflow-hidden bg-[#F7F5FA]">
						{imageGallery.length > 1 ? (
							<ProductImageCarousel slides={imageGallery} />
						) : product.thumbnail ? (
							<Image
								alt={product.title}
								className="object-cover w-full h-full group-hover:scale-[1.04] transition-transform duration-500 ease-out"
								fill
								priority
								sizes="(max-width: 640px) 100vw, 300px"
								src={getImageUrl(decodeURIComponent(product.thumbnail))}
							/>
						) : (
							<Image
								alt="Product placeholder"
								fill
								sizes="300px"
								src="/images/placeholder.svg"
								className="object-cover"
							/>
						)}
					</div>
				</LocalizedClientLink>

				{/* Discount badge */}
				{isDiscounted && (
					<span className="absolute top-3 left-3 z-10 bg-[#432C63] text-white text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full">
						−{discountPct}%
					</span>
				)}

				{/* Wishlist button — always visible */}
				<div className="absolute top-2.5 right-2.5 z-10">
					<WishlistButton
						className="border-0 !w-8 !h-8 !p-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
						productId={product.id}
						user={user}
						wishlist={wishlist}
					/>
				</div>

				{/* ── Content ── */}
				<div className="flex flex-col flex-1 px-4 pt-3.5 pb-4 gap-3">

					{/* Title */}
					<LocalizedClientLink href={`/products/${product.handle}`}>
						<h3 className="text-[13.5px] font-semibold text-[#1B1B1B] leading-snug line-clamp-2 min-h-[2.6em] group-hover:text-[#432C63] transition-colors duration-200">
							{product.title}
						</h3>
					</LocalizedClientLink>

					{/* Price + rating row */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-1.5">
							<span className="text-[15px] font-bold text-[#432C63]">
								{cheapestPrice?.calculated_price}
							</span>
							{isDiscounted && (
								<span className="text-[11px] text-gray-400 line-through font-medium">
									{cheapestPrice?.original_price}
								</span>
							)}
						</div>
						{reviewCount > 0 && (
							<div className="flex items-center gap-1">
								<StarRating rate={averageRating} starSize={12} />
								<span className="text-[11px] text-gray-400 font-medium">
									({reviewCount})
								</span>
							</div>
						)}
					</div>

					{/* Seller chip */}
					{api_product?.seller && (
						<LocalizedClientLink href={`/sellers/${api_product.seller.handle || ''}`}>
							<div className="flex items-center gap-2 w-fit max-w-full px-2.5 py-1.5 rounded-full bg-[#F7F5FA] hover:bg-[#EDE8F5] transition-colors">
								<Avatar
									className="rounded-full h-5 w-5 flex-shrink-0"
									initials={api_product.seller.name?.[0]?.toUpperCase() ?? 'S'}
									size="small"
									src={api_product.seller.photo || '/talkjs-placeholder.jpg'}
								/>
								<span className="text-[11px] font-medium text-[#432C63] truncate max-w-[140px]">
									{api_product.seller.name}
								</span>
							</div>
						</LocalizedClientLink>
					)}

					{/* Add to Cart */}
					<LocalizedClientLink
						href={`/products/${product.handle}`}
						className="mt-auto block w-full text-center text-[13px] font-semibold text-white rounded-xl py-2.5 transition-opacity duration-200 hover:opacity-85"
						style={{ backgroundColor: '#432C63' }}
					>
						Add to Cart
					</LocalizedClientLink>
				</div>
			</div>
		</div>
	);
};
