'use client';

import type { HttpTypes } from '@medusajs/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button, StarRating, Tag } from '@/components/atoms';
import { FlashSaleCountdown } from '@/components/sections/FlashSaleSection/FlashSaleCountdown';
import {
	ErrorMessage,
	ProductVariants,
	ShareButton,
} from '@/components/molecules';
import { UpdateItemQuantityButton } from '@/components/molecules/UpdateItemQuantityButton/UpdateItemQuantityButton';
import useGetAllSearchParams from '@/hooks/useGetAllSearchParams';
import { addToCart, addFlashSaleItemToCart } from '@/lib/data/cart';
import type { ActiveFlashSaleItem } from '@/lib/data/flash-sales';
import { getProductPrice } from '@/lib/helpers/get-product-price';
import { cn } from '@/lib/utils';
import type { SellerProps } from '@/types/seller';
import type { Wishlist } from '@/types/wishlist';

import { WishlistButton } from '../WishlistButton/WishlistButton';

const optionsAsKeymap = (
	variantOptions: HttpTypes.StoreProductVariant['options'],
) => {
	return variantOptions?.reduce(
		(
			acc: Record<string, string>,
			varopt: HttpTypes.StoreProductOptionValue,
		) => {
			acc[varopt.option?.title.toLowerCase() || ''] = varopt.value;
			return acc;
		},
		{},
	);
};

export const ProductDetailsHeader = ({
	product,
	locale,
	user,
	wishlist,
	flashSaleItem,
}: {
	product: HttpTypes.StoreProduct & { seller?: SellerProps; reviews?: any[] };
	locale: string;
	user: HttpTypes.StoreCustomer | null;
	wishlist?: Wishlist[];
	flashSaleItem?: ActiveFlashSaleItem | null;
}) => {
	const [isAdding, setIsAdding] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [quantity, setQuantity] = useState(1);
	const { allSearchParams } = useGetAllSearchParams();
	const router = useRouter();

	const productReviews =
		product.reviews?.filter(
			(rev: any) => rev !== null && rev.reference === 'product',
		) || [];
	const reviewCount = productReviews.length;
	const averageRating =
		reviewCount > 0
			? productReviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
				reviewCount
			: 0;

	const { cheapestVariant } = getProductPrice({ product });
	const selectedVariant = {
		...optionsAsKeymap(cheapestVariant.options ?? null),
		...allSearchParams,
	};

	const variantId =
		product.variants?.find(({ options }: { options: any }) =>
			options?.every((option: any) =>
				selectedVariant[
					option.option?.title.toLowerCase() || ''
				]?.includes(option.value),
			),
		)?.id || '';

	const { variantPrice } = getProductPrice({ product, variantId });

	const handleAddToCart = async () => {
		if (!variantId) return null;
		if (!user) {
			const currentPath =
				window.location.pathname + window.location.search;
			router.push(`/user?returnTo=${encodeURIComponent(currentPath)}`);
			return;
		}
		setIsAdding(true);
		setError(null);
		try {
			if (flashSaleItem) {
				await addFlashSaleItemToCart({
					countryCode: locale,
					quantity,
					variantId,
					flashSaleItemId: flashSaleItem.id,
				});
			} else {
				await addToCart({ countryCode: locale, quantity, variantId });
			}
		} catch (err) {
			setError((err as Error).message);
		}
		setIsAdding(false);
	};

	const variantStock =
		product.variants?.find(({ id }) => id === variantId)
			?.inventory_quantity || 0;
	const variantHasPrice = !!product.variants?.find(
		({ id }) => id === variantId,
	)?.calculated_price;

	const originalPrice = Number.parseInt(
		variantPrice?.original_price as string,
		10,
	);
	const calculatedPrice = Number.parseInt(
		variantPrice?.calculated_price as string,
		10,
	);
	const discount = ((originalPrice - calculatedPrice) / originalPrice) * 100;

	const basePriceNumber = variantPrice?.original_price_number as
		| number
		| undefined;
	const flashSalePrice =
		flashSaleItem && basePriceNumber && basePriceNumber > 0
			? flashSaleItem.discount_type === 'percentage'
				? Math.round(
						basePriceNumber * (1 - flashSaleItem.discount_value / 100),
					)
				: Math.max(
						0,
						Math.round(basePriceNumber - flashSaleItem.discount_value),
					)
			: null;
	const flashSaleDiscountPct =
		flashSaleItem?.discount_type === 'percentage'
			? flashSaleItem.discount_value
			: basePriceNumber && flashSalePrice !== null
				? Math.round(
						((basePriceNumber - flashSalePrice) / basePriceNumber) * 100,
					)
				: null;

	const inStock = variantStock > 0;

	return (
		<div className="flex flex-col gap-5">
			{/* Title + Rating */}
			<div className="flex flex-col gap-2">
				<h1 className="heading-lg text-primary font-lora !font-bold leading-tight">
					{product.title}
				</h1>
				{reviewCount > 0 ? (
					<div className="flex items-center gap-2">
						<StarRating rate={averageRating} starSize={14} />
						<span className="text-[13px] font-bold text-[#432C63]">
							{averageRating.toFixed(1)}
						</span>
						<span className="text-[13px] text-gray-400">
							({reviewCount}{' '}
							{reviewCount === 1 ? 'review' : 'reviews'})
						</span>
					</div>
				) : (
					<span className="text-[12.5px] text-gray-400">
						No reviews yet
					</span>
				)}
			</div>

			{/* Flash sale banner */}
			{flashSaleItem && flashSalePrice !== null && (
				<div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
					<div className="flex items-center gap-1.5 text-red-600 font-semibold text-[13px]">
						<svg
							width="13"
							height="13"
							viewBox="0 0 24 24"
							fill="currentColor"
						>
							<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
						</svg>
						Flash Sale
						{flashSaleDiscountPct !== null && (
							<span className="ml-1 rounded-md bg-red-600 text-white text-[11px] font-extrabold px-1.5 py-0.5">
								-{flashSaleDiscountPct}%
							</span>
						)}
					</div>
					<FlashSaleCountdown endsAt={flashSaleItem.ends_at} />
				</div>
			)}

			{/* Price + Stock */}
			<div className="flex items-center flex-wrap gap-2.5">
				{flashSalePrice !== null ? (
					<>
						<span
							className={cn(
								'heading-md !font-bold text-red-600',
								variantStock < 1 && 'line-through',
							)}
						>
							₱{flashSalePrice.toLocaleString()}
						</span>
						<span className="heading-md line-through text-black/30 !font-bold">
							{variantPrice?.original_price}
						</span>
					</>
				) : (
					<>
						<span
							className={cn(
								'heading-md text-primary !font-bold',
								variantStock < 1 && 'line-through',
							)}
						>
							{variantPrice?.calculated_price}
						</span>
						{variantPrice?.calculated_price_number !==
							variantPrice?.original_price_number && (
							<span className="heading-md line-through text-black/30 !font-bold">
								{variantPrice?.original_price}
							</span>
						)}
					</>
				)}
				{flashSalePrice === null && discount > 0 && (
					<Tag value={discount} />
				)}
				<div className="h-4 w-px bg-black/20 mx-0.5" />
				<div className="flex items-center gap-1.5">
					<span
						className={cn(
							'w-2 h-2 rounded-full',
							inStock ? 'bg-emerald-400' : 'bg-red-400',
						)}
					/>
					<span
						className={cn(
							'text-[13px] font-semibold',
							inStock ? 'text-emerald-600' : 'text-red-500',
						)}
					>
						{inStock ? 'In Stock' : 'Out of Stock'}
					</span>
				</div>
			</div>

			{/* Description */}
			{product.description && (
				<div
					className="text-[14px] text-gray-500 leading-relaxed"
					dangerouslySetInnerHTML={{ __html: product.description }}
				/>
			)}

			{/* Divider */}
			<div className="h-px w-full bg-black/[0.08]" />

			{/* Variants */}
			<ProductVariants
				product={product}
				selectedVariant={selectedVariant}
			/>

			{/* Quantity + Add to Cart + Wishlist */}
			<div className="flex items-center gap-3">
				<UpdateItemQuantityButton
					isProductPage
					quantity={quantity}
					setQuantity={setQuantity}
				/>
				<Button
					className="flex-1 uppercase py-3 flex justify-center !font-semibold text-[13.5px] tracking-wide"
					disabled={isAdding || !variantStock || !variantHasPrice}
					loading={isAdding}
					onClick={handleAddToCart}
					size="large"
				>
					{variantStock && variantHasPrice
						? 'Add to Cart'
						: 'Out of Stock'}
				</Button>
				<WishlistButton
					productId={product.id}
					user={user}
					wishlist={wishlist}
				/>
				<ShareButton
					image={product.thumbnail ?? undefined}
					price={
						flashSalePrice !== null
							? `₱${flashSalePrice.toLocaleString()}`
							: variantPrice?.calculated_price
					}
					title={product.title}
					variantParams={selectedVariant}
				/>
			</div>

			{error && (
				<ErrorMessage data-testid="add-to-cart-error" error={error} />
			)}
		</div>
	);
};
