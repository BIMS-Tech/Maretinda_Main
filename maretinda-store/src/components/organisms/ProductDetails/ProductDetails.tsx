import type { HttpTypes } from '@medusajs/types';

import {
	ProductAdditionalAttributes,
	// ProductDetailsFooter,
	ProductDetailsHeader,
	ProductDetailsSeller,
	// ProductDetailsShipping,
	ProductFreeDeliveryDetails,
	// ProductPageDetails,
	ProductReturnDeliveryDetails,
} from '@/components/cells';
import { retrieveCustomer } from '@/lib/data/customer';
import { getUserWishlists } from '@/lib/data/wishlist';
import type { AdditionalAttributeProps } from '@/types/product';
import type { SellerProps } from '@/types/seller';
import type { Wishlist } from '@/types/wishlist';

export const ProductDetails = async ({
	product,
	locale,
	seller,
}: {
	product: HttpTypes.StoreProduct & {
		attribute_values?: AdditionalAttributeProps[];
	};
	locale: string;
	seller: SellerProps;
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
			<ProductDetailsSeller seller={seller} />

			<div className="accordion-multiple mt-5">
				<ProductFreeDeliveryDetails />
				<ProductReturnDeliveryDetails />
			</div>

			{/* <ProductPageDetails details={product?.description || ''} /> */}
			<ProductAdditionalAttributes
				attributes={product?.attribute_values || []}
			/>
			{/* <ProductDetailsShipping /> */}

			{/* <ProductDetailsFooter
				posted={product?.created_at}
				tags={product?.tags || []}
			/> */}
		</div>
	);
};
