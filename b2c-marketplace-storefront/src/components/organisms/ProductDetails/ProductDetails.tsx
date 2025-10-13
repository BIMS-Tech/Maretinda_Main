import type { HttpTypes } from '@medusajs/types';

import {
	ProductAdditionalAttributes,
	ProductDetailsFooter,
	ProductDetailsHeader,
	ProductDetailsSeller,
	ProductDetailsShipping,
	ProductPageDetails,
} from '@/components/cells';
import { retrieveCustomer } from '@/lib/data/customer';
import { getUserWishlists } from '@/lib/data/wishlist';
import type { AdditionalAttributeProps } from '@/types/product';
import type { SellerProps } from '@/types/seller';
import type { Wishlist } from '@/types/wishlist';

export const ProductDetails = async ({
	product,
	locale,
}: {
	product: HttpTypes.StoreProduct & {
		seller?: SellerProps;
		attribute_values?: AdditionalAttributeProps[];
	};
	locale: string;
}) => {
	const user = await retrieveCustomer();

	let wishlist: Wishlist[] = [];
	if (user) {
		try {
			const response = await getUserWishlists();
			wishlist = response.wishlists;
		} catch (error) {
			console.warn('Failed to fetch wishlist:', error);
			// Continue without wishlist data instead of crashing
			wishlist = [];
		}
	}

	return (
		<div>
			<ProductDetailsHeader
				locale={locale}
				product={product}
				user={user}
				wishlist={wishlist}
			/>
			<ProductPageDetails details={product?.description || ''} />
			<ProductAdditionalAttributes
				attributes={product?.attribute_values || []}
			/>
			<ProductDetailsShipping />
			<ProductDetailsSeller seller={product?.seller} />
			<ProductDetailsFooter
				posted={product?.created_at}
				tags={product?.tags || []}
			/>
		</div>
	);
};
