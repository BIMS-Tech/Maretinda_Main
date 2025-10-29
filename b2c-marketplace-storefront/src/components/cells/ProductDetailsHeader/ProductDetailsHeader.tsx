'use client';

import type { HttpTypes } from '@medusajs/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button, StarRating, Tag } from '@/components/atoms';
import { ErrorMessage, ProductVariants } from '@/components/molecules';
import { UpdateCartItemButton } from '@/components/molecules/UpdateCartItemButton/UpdateCartItemButton';
import { Chat } from '@/components/organisms/Chat/Chat';
import useGetAllSearchParams from '@/hooks/useGetAllSearchParams';
import { addToCart } from '@/lib/data/cart';
import { getProductPrice } from '@/lib/helpers/get-product-price';
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
	product: HttpTypes.StoreProduct & { seller?: SellerProps };
	locale: string;
	user: HttpTypes.StoreCustomer | null;
	wishlist?: Wishlist[];
}) => {
	const [isAdding, setIsAdding] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { allSearchParams } = useGetAllSearchParams();
	const router = useRouter();

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
				quantity: 1,
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
					<div className="flex items-center gap-2 my-2">
						<StarRating rate={4} starSize={16} />
						<span className="text-md text-black/60 !font-medium">
							<span className="text-black">4.5/</span>5
						</span>
					</div>
					<div className="mt-2 flex gap-2 items-center">
						<span className="heading-md text-primary !font-bold">
							{variantPrice?.calculated_price}
						</span>
						{/* REMOVE THE "!"" IN INTERGRATION */}
						{!variantPrice?.calculated_price_number !==
							variantPrice?.original_price_number && (
							<span className="heading-md line-through text-black/30 !font-bold">
								{variantPrice?.original_price}
							</span>
						)}
						<div className="flex items-center justify-center gap-3 ml-6">
							<Tag value="-40%" />
							<div className="h-3.5 w-[1px] bg-black" />
							<span className="text-[#00FF66] text-base">
								In Stock
							</span>
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
				<UpdateCartItemButton
					isProductPage
					lineItemId={product.id}
					quantity={1} //Change this to actual value
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
			{/* Seller message */}

			{user && product.seller && (
				<Chat
					buttonClassNames="w-full uppercase"
					product={product}
					seller={product.seller}
					user={user}
				/>
			)}
		</div>
	);
};
