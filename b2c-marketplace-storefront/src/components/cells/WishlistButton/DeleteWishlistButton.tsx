"use client";

import type { HttpTypes } from "@medusajs/types";
import { useEffect, useState } from "react";

import { Button } from "@/components/atoms";
import { Trash } from "@medusajs/icons";
import { addWishlistItem, removeWishlistItem } from "@/lib/data/wishlist";
import { cn } from "@/lib/utils";
import type { Wishlist } from "@/types/wishlist";

export const DeleteWishlistButton = ({
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

	// TODO: COMMENTED OUT FOR DESIGN PURPOSES
	// if (!user) {
	// 	return null;
	// }

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
		"w-[32px] h-[32px] rounded-full p-0 flex items-center justify-center border bg-white shadow-[0px_0px_0px_1px_#00000014,_0px_1px_2px_0px_#0000001F]";

	return (
		<Button
			className={cn(baseClasses, className)}
			disabled={isWishlistAdding}
			loading={isWishlistAdding}
			onClick={handleRemoveFromWishlist}
			variant="tonal"
		>
			<Trash />
		</Button>
	);
};
