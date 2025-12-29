'use client';

import type { HttpTypes } from '@medusajs/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button, StarRating, Tag } from '@/components/atoms';
import { ErrorMessage, ProductVariants } from '@/components/molecules';
import { UpdateItemQuantityButton } from '@/components/molecules/UpdateItemQuantityButton/UpdateItemQuantityButton';
import useGetAllSearchParams from '@/hooks/useGetAllSearchParams';
import { addToCart } from '@/lib/data/cart';
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
}: {
	product: HttpTypes.StoreProduct & { seller?: SellerProps; reviews?: any[] };
	locale: string;
	user: HttpTypes.StoreCustomer | null;
	wishlist?: Wishlist[];
}) => {
	const [isAdding, setIsAdding] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [quantity, setQuantity] = useState(1);
	const { allSearchParams } = useGetAllSearchParams();
	const router = useRouter();

	// Calculate real product ratings
	const productReviews = product.reviews?.filter((rev: any) => rev !== null && rev.reference === 'product') || [];
	const reviewCount = productReviews.length;
	const averageRating = reviewCount > 0
		? productReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount
		: 0;

	const { cheapestVariant } = getProductPrice({
		product,
	});
	// set default variant
	const selectedVariant = {
		...optionsAsKeymap(cheapestVariant.options ?? null),
		...allSearchParams,
	};

	// get selected variant id
	const variantId =
		product.variants?.find(({ options }: { options: any }) =>
			options?.every((option: any) =>
				selectedVariant[
					option.option?.title.toLowerCase() || ''
				]?.includes(option.value),
			),
		)?.id || '';

	// get variant price
	const { variantPrice } = getProductPrice({
		product,
		variantId,
	});

	// add the selected variant to the cart
	const handleAddToCart = async () => {
		if (!variantId) return null;

		// Check if user is authenticated
		if (!user) {
			const currentPath =
				window.location.pathname + window.location.search;
			router.push(`/user?returnTo=${encodeURIComponent(currentPath)}`);
			return;
		}

		setIsAdding(true);
		setError(null);

		try {
			await addToCart({
				countryCode: locale,
				quantity: quantity,
				variantId: variantId,
			});
		} catch (err) {
			setError((err as Error).message);
		}

		setIsAdding(false);
	};

	const variantStock =
		product.variants?.find(({ id }) => id === variantId)
			?.inventory_quantity || 0;

	const variantHasPrice = product.variants?.find(({ id }) => id === variantId)
		?.calculated_price
		? true
		: false;

	const originalPrice = Number.parseInt(
		variantPrice?.original_price as string,
		10,
	);
	const calculatedPrice = Number.parseInt(
		variantPrice?.calculated_price as string,
		10,
	);

	const discount = ((originalPrice - calculatedPrice) / originalPrice) * 100;

	return (
		<div className="">
			<div className="flex justify-between">
				<div>
					<h2 className="label-md text-secondary">
						{/* {product?.brand || "No brand"} */}
					</h2>
				<h1 className="heading-lg text-primary font-lora !font-bold">
					{product.title}
				</h1>
				{reviewCount > 0 && (
					<div className="flex items-center gap-2 my-2">
						<StarRating rate={averageRating} starSize={16} />
						<span className="text-md text-black/60 !font-medium">
							<span className="text-black">{averageRating.toFixed(1)}/</span>5
							{' '}({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
						</span>
					</div>
				)}
					<div className="mt-2 flex gap-2 items-center">
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
						<div
							className={cn(
								'flex items-center justify-center gap-3 ml-2',
								discount > 0 && 'ml-6',
							)}
						>
							{discount > 0 && <Tag value={discount} />}
							<div className="h-3.5 w-[1px] bg-black" />
							{variantStock > 0 ? (
								<span className="text-[#00FF66] text-base">
									In Stock
								</span>
							) : (
								<span className="text-red-400 text-base">
									Out of Stock
								</span>
							)}
						</div>
					</div>
					<div
						className="text-base text-black/60 mt-4"
						dangerouslySetInnerHTML={{
							__html: product.description || '',
						}}
					/>
				</div>
			</div>

			<div className="h-[1px] my-5 w-full bg-black/10" />

			{/* Product Variants */}
			<ProductVariants
				product={product}
				selectedVariant={selectedVariant}
			/>

			<div className="flex items-center justify-between gap-4 mb-5">
				<UpdateItemQuantityButton
					isProductPage
					quantity={quantity}
					setQuantity={setQuantity}
				/>
				{/* Add to Cart */}
				<Button
					className="w-full uppercase py-3 flex justify-center !font-normal !text-black"
					disabled={isAdding || !variantStock || !variantHasPrice}
					loading={isAdding}
					onClick={handleAddToCart}
					size="large"
				>
					{variantStock && variantHasPrice
						? 'ADD TO CART'
						: 'OUT OF STOCK'}
				</Button>
				<div>
					{/* Add to Wishlist */}
					<WishlistButton
						productId={product.id}
						user={user}
						wishlist={wishlist}
					/>
				</div>
			</div>

			{error && (
				<ErrorMessage data-testid="add-to-cart-error" error={error} />
			)}
		</div>
	);
};
