import type { HttpTypes } from '@medusajs/types';
import { Badge } from '@medusajs/ui';
import clsx from 'clsx';
import type { BaseHit, Hit } from 'instantsearch.js';
import Image from 'next/image';

import { Avatar, Button, StarRating } from '@/components/atoms';
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
	if (!api_product) {
		return null;
	}

	const { cheapestPrice } = getProductPrice({
		// biome-ignore lint/style/noNonNullAssertion: api_product will always be available
		product: api_product! as StoreProduct,
	});

	// Calculate real product ratings
	const productReviews = api_product.reviews?.filter((rev: any) => rev !== null && rev.reference === 'product') || [];
	const reviewCount = productReviews.length;
	const averageRating = reviewCount > 0
		? productReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount
		: 0;

	const isDiscounted =
		cheapestPrice?.calculated_price !== cheapestPrice?.original_price;
	let discountedPrice: number = 0;
	if (isDiscounted) {
		const original_price = Number.parseInt(
			cheapestPrice?.original_price as string,
			10,
		);
		const calculated_price = Number.parseInt(
			cheapestPrice?.calculated_price as string,
			10,
		);
		discountedPrice =
			((original_price - calculated_price) / original_price) * 100;
	}

	const imageGallery = product.images.map(
		(image: { id: string; name: string; url: string }) => ({
			...image,
			url: getImageUrl(image.url),
		}),
	);

	return (
		<div className="py-5 px-2 sm:max-w-[315px] lg:max-w-[312px] lg:w-[312px] w-full min-h-[400px] ">
			<div
				className={clsx(
					' group bg-white hover:shadow-lg rounded-sm flex flex-col justify-start w-full overflow-hidden',
				)}
			>
				<div className="relative w-full bg-primary">
					<LocalizedClientLink href={`/products/${product.handle}`}>
						<div className="relative overflow-hidden w-full h-full flex justify-center align-center max-h-[220px]">
							{imageGallery.length > 1 ? (
								<ProductImageCarousel slides={imageGallery} />
							) : product.thumbnail ? (
								<Image
									alt={product.title}
									className="object-cover w-full object-center h-full transition-all duration-300 max-h-[220px]"
									height={220}
									priority
									src={getImageUrl(
										decodeURIComponent(product.thumbnail),
									)}
									width={295}
								/>
							) : (
								<Image
									alt="Product placeholder"
									height={220}
									src="/images/placeholder.svg"
									width={295}
								/>
							)}
						</div>
					</LocalizedClientLink>
					{cheapestPrice?.calculated_price !==
						cheapestPrice?.original_price && (
						<Badge
							className="absolute top-3.5 left-3.5 z-10 bg-brand-purple-900 text-white text-[11px] border-0 px-1.5 py-1"
							size="2xsmall"
						>
							{`-${discountedPrice}%`}
						</Badge>
					)}
					<div className="absolute top-0 right-0 z-10 group-hover:block hidden">
						{/* Add to Wishlist */}
						<WishlistButton
							className="border-0"
							productId={product.id}
							user={user}
							wishlist={wishlist}
						/>
					</div>
				</div>
				<div className="relative flex flex-1">
					<LocalizedClientLink
						className="flex flex-col justify-between px-4 py-5 w-full"
						href={`/products/${product.handle}`}
					>
						<div>
							<h3 className="heading-sm truncate">
								{product.title}
							</h3>
							<div className="flex items-center gap-2 mt-2">
								<p className="font-medium text-red-500">
									{cheapestPrice?.calculated_price}
								</p>
								{cheapestPrice?.calculated_price !==
									cheapestPrice?.original_price && (
									<p className="text-md !font-medium text-gray-500 line-through">
										{cheapestPrice?.original_price}
									</p>
								)}
							</div>
						{reviewCount > 0 && (
							<div className="flex items-center gap-2 mt-2">
								<StarRating rate={averageRating} starSize={16} />
								<span className="text-md text-black/60 !font-medium">
									({reviewCount})
								</span>
							</div>
						)}
						</div>

						<div className="flex items-center gap-2.5 mt-6">
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
					</LocalizedClientLink>
					<Button className="absolute rounded-sm bg-action text-action-on-primary !font-medium group-hover:block hidden h-auto lg:h-[40px] w-[calc(100%-32px)] -mx-[calc(50%-16px)] left-1/2 bottom-5 z-10">
						Add to Cart
					</Button>
				</div>
			</div>
		</div>
	);
};
