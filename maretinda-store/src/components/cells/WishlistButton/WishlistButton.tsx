'use client';

import type { HttpTypes } from '@medusajs/types';
import { useRouter } from 'next/navigation';
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
	const router = useRouter();
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

	const sendToLogin = () => {
		const currentPath = window.location.pathname + window.location.search;
		router.push(`/user?returnTo=${encodeURIComponent(currentPath)}`);
	};

	// Flip the heart right away and undo it if the request fails; the server
	// action refreshes the page data, which the effect above then syncs from
	const toggleWishlist = async () => {
		const adding = !isWishlisted;
		setIsWishlistAdding(true);
		setIsWishlisted(adding);
		try {
			const result = adding
				? await addWishlistItem({
						reference: 'product',
						reference_id: productId,
					})
				: await removeWishlistItem({
						product_id: productId,
						wishlist_id: wishlist?.[0]?.id,
					});
			if (!result.ok) {
				setIsWishlisted(!adding);
				if (result.status === 401) sendToLogin();
			}
		} catch (error) {
			setIsWishlisted(!adding);
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
			onClick={toggleWishlist}
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
