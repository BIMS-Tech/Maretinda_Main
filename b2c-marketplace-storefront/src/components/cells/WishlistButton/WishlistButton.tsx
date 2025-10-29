'use client';

import type { HttpTypes } from '@medusajs/types';
import { useEffect, useState } from 'react';

import { Button } from '@/components/atoms';
import { HeartFilledIcon, HeartIcon } from '@/icons';
import { addWishlistItem, removeWishlistItem } from '@/lib/data/wishlist';
import { cn } from '@/lib/utils';
import type { Wishlist } from '@/types/wishlist';

export const WishlistButton = ({
	productId,
	wishlist,
	user,
	className,
}: {
	productId: string;
	wishlist?: Wishlist[];
	user?: HttpTypes.StoreCustomer | null;
	className?: string;
}) => {
	const [isWishlistAdding, setIsWishlistAdding] = useState(false);
	const [isWishlisted, setIsWishlisted] = useState(
		wishlist?.[0]?.products?.some((item) => item.id === productId),
	);

	useEffect(() => {
		setIsWishlisted(
			wishlist?.[0]?.products?.some((item) => item.id === productId),
		);
	}, [wishlist, productId]);

	//  COMMENTED OUT FOR DESIGN PURPOSES
	// if (!user) {
	// 	return null;
	// }

	const handleAddToWishlist = async () => {
		try {
			setIsWishlistAdding(true);
			await addWishlistItem({
				reference: 'product',
				reference_id: productId,
			});
		} catch (error) {
			console.error(error);
		} finally {
			setIsWishlistAdding(false);
		}
	};

	const handleRemoveFromWishlist = async () => {
		try {
			setIsWishlistAdding(true);

			await removeWishlistItem({
				product_id: productId,
				wishlist_id: wishlist?.[0].id!,
			});
		} catch (error) {
			console.error(error);
		} finally {
			setIsWishlistAdding(false);
		}
	};
	const baseClasses =
		'w-[46px] h-[46px] p-0 flex items-center justify-center border border-black !bg-transparent';

	return (
		<Button
			className={cn(baseClasses, className)}
			disabled={isWishlistAdding}
			loading={isWishlistAdding}
			onClick={
				isWishlisted
					? () => handleRemoveFromWishlist()
					: () => handleAddToWishlist()
			}
			variant="tonal"
		>
			{isWishlisted ? (
				<HeartFilledIcon size={20} />
			) : (
				<HeartIcon size={20} />
			)}
		</Button>
	);
};
