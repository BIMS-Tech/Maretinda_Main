'use client';

import type { HttpTypes } from '@medusajs/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/atoms';
import { ErrorMessage, ProductVariants } from '@/components/molecules';
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
		<div className="border rounded-sm p-5">
			<div className="flex justify-between">
				<div>
					<h2 className="label-md text-secondary">
						{/* {product?.brand || "No brand"} */}
					</h2>
					<h1 className="heading-lg text-primary">{product.title}</h1>
					<div className="mt-2 flex gap-2 items-center">
						<span className="heading-md text-primary">
							{variantPrice?.calculated_price}
						</span>
						{variantPrice?.calculated_price_number !==
							variantPrice?.original_price_number && (
							<span className="label-md text-secondary line-through">
								{variantPrice?.original_price}
							</span>
						)}
					</div>
				</div>
				<div>
					{/* Add to Wishlist */}
					<WishlistButton
						productId={product.id}
						user={user}
						wishlist={wishlist}
					/>
				</div>
			</div>
			{/* Product Variants */}
			<ProductVariants
				product={product}
				selectedVariant={selectedVariant}
			/>
			{/* Add to Cart */}
			<Button
				className="w-full uppercase mb-4 py-3 flex justify-center"
				disabled={isAdding || !variantStock || !variantHasPrice}
				loading={isAdding}
				onClick={handleAddToCart}
				size="large"
			>
				{variantStock && variantHasPrice
					? 'ADD TO CART'
					: 'OUT OF STOCK'}
			</Button>
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
