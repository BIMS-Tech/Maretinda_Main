'use client';

import type { HttpTypes } from '@medusajs/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { StarRating } from '@/components/atoms';
import { FlashSaleCountdown } from '@/components/sections/FlashSaleSection/FlashSaleCountdown';
import { ErrorMessage, ProductVariants } from '@/components/molecules';
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
		(acc: Record<string, string>, varopt: HttpTypes.StoreProductOptionValue) => {
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

	const productReviews = product.reviews?.filter(
		(rev: any) => rev !== null && rev.reference === 'product',
	) || [];
	const reviewCount = productReviews.length;
	const averageRating =
		reviewCount > 0
			? productReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount
			: 0;

	const { cheapestVariant } = getProductPrice({ product });
	const selectedVariant = {
		...optionsAsKeymap(cheapestVariant.options ?? null),
		...allSearchParams,
	};

	const variantId =
		product.variants?.find(({ options }: { options: any }) =>
			options?.every((option: any) =>
				selectedVariant[option.option?.title.toLowerCase() || '']?.includes(option.value),
			),
		)?.id || '';

	const { variantPrice } = getProductPrice({ product, variantId });

	const handleAddToCart = async () => {
		if (!variantId) return null;
		if (!user) {
			const currentPath = window.location.pathname + window.location.search;
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
		product.variants?.find(({ id }) => id === variantId)?.inventory_quantity || 0;
	const variantHasPrice = !!product.variants?.find(({ id }) => id === variantId)?.calculated_price;

	const originalPrice = Number.parseInt(variantPrice?.original_price as string, 10);
	const calculatedPrice = Number.parseInt(variantPrice?.calculated_price as string, 10);
	const discount = ((originalPrice - calculatedPrice) / originalPrice) * 100;

	const basePriceNumber = variantPrice?.original_price_number as number | undefined;
	const flashSalePrice =
		flashSaleItem && basePriceNumber && basePriceNumber > 0
			? flashSaleItem.discount_type === 'percentage'
				? Math.round(basePriceNumber * (1 - flashSaleItem.discount_value / 100))
				: Math.max(0, Math.round(basePriceNumber - flashSaleItem.discount_value))
			: null;
	const flashSaleDiscountPct =
		flashSaleItem?.discount_type === 'percentage'
			? flashSaleItem.discount_value
			: basePriceNumber && flashSalePrice !== null
				? Math.round(((basePriceNumber - flashSalePrice) / basePriceNumber) * 100)
				: null;

	const inStock = variantStock > 0;

	return (
		<div className="flex flex-col gap-5">

			{/* ── Title + Rating ── */}
			<div>
				<h1 className="text-[22px] sm:text-[26px] font-bold text-[#1B1B1B] leading-tight font-lora mb-2">
					{product.title}
				</h1>
				{reviewCount > 0 && (
					<div className="flex items-center gap-2">
						<StarRating rate={averageRating} starSize={14} />
						<span className="text-[12px] text-[#432C63] font-semibold">
							{averageRating.toFixed(1)}
						</span>
						<span className="text-[12px] text-gray-400">
							({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
						</span>
					</div>
				)}
			</div>

			{/* ── Flash sale banner ── */}
			{flashSaleItem && flashSalePrice !== null && (
				<div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#FFF8F0] border border-[#FFD9A0] px-4 py-3">
					<div className="flex items-center gap-1.5">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="#E07B00">
							<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
						</svg>
						<span className="text-[12px] font-bold text-[#E07B00]">Flash Sale</span>
						{flashSaleDiscountPct !== null && (
							<span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#E07B00] text-white">
								−{flashSaleDiscountPct}%
							</span>
						)}
					</div>
					<FlashSaleCountdown endsAt={flashSaleItem.ends_at} />
				</div>
			)}

			{/* ── Price ── */}
			<div className="flex items-baseline gap-3">
				{flashSalePrice !== null ? (
					<>
						<span className={cn('text-[28px] font-bold text-[#432C63]', variantStock < 1 && 'line-through opacity-50')}>
							₱{flashSalePrice.toLocaleString()}
						</span>
						<span className="text-[16px] text-gray-400 line-through font-medium">
							{variantPrice?.original_price}
						</span>
					</>
				) : (
					<>
						<span className={cn('text-[28px] font-bold text-[#432C63]', variantStock < 1 && 'line-through opacity-50')}>
							{variantPrice?.calculated_price}
						</span>
						{variantPrice?.calculated_price_number !== variantPrice?.original_price_number && (
							<span className="text-[16px] text-gray-400 line-through font-medium">
								{variantPrice?.original_price}
							</span>
						)}
						{flashSalePrice === null && discount > 0 && (
							<span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#432C63] text-white">
								−{Math.round(discount)}%
							</span>
						)}
					</>
				)}
				<span className="flex items-center gap-1 ml-1">
					<span className={cn('w-2 h-2 rounded-full', inStock ? 'bg-emerald-400' : 'bg-red-400')} />
					<span className={cn('text-[12px] font-medium', inStock ? 'text-emerald-600' : 'text-red-500')}>
						{inStock ? 'In Stock' : 'Out of Stock'}
					</span>
				</span>
			</div>

			{/* ── Description ── */}
			{product.description && (
				<p
					className="text-[13.5px] text-gray-500 leading-relaxed"
					dangerouslySetInnerHTML={{ __html: product.description }}
				/>
			)}

			{/* ── Divider ── */}
			<div className="h-px w-full bg-black/[0.07]" />

			{/* ── Variants ── */}
			<ProductVariants product={product} selectedVariant={selectedVariant} />

			{/* ── Quantity + Add to Cart + Wishlist ── */}
			<div className="flex items-center gap-3">
				<UpdateItemQuantityButton
					isProductPage
					quantity={quantity}
					setQuantity={setQuantity}
				/>
				<button
					type="button"
					disabled={isAdding || !inStock || !variantHasPrice}
					onClick={handleAddToCart}
					className={cn(
						'flex-1 h-[46px] rounded-2xl text-[14px] font-bold text-white transition-all duration-200',
						'disabled:opacity-50 disabled:cursor-not-allowed',
						inStock && variantHasPrice
							? 'bg-[#432C63] hover:bg-[#3a2557] active:scale-[0.98]'
							: 'bg-gray-300 text-gray-500',
					)}
				>
					{isAdding ? (
						<span className="flex items-center justify-center gap-2">
							<svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
								<path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
							</svg>
							Adding…
						</span>
					) : inStock && variantHasPrice ? 'Add to Cart' : 'Out of Stock'}
				</button>
				<WishlistButton
					productId={product.id}
					user={user}
					wishlist={wishlist}
					className="!h-[46px] !w-[46px] flex items-center justify-center rounded-2xl border border-black/10 hover:border-[#432C63]/40 hover:bg-[#F2ECF8] transition-colors flex-shrink-0"
				/>
			</div>

			{error && <ErrorMessage data-testid="add-to-cart-error" error={error} />}
		</div>
	);
};
