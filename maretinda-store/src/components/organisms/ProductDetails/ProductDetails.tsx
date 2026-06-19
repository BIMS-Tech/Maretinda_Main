import type { HttpTypes } from '@medusajs/types';

import {
	ProductAdditionalAttributes,
	ProductDetailsHeader,
	ProductDetailsSeller,
	ProductFreeDeliveryDetails,
	ProductReturnDeliveryDetails,
} from '@/components/cells';
import type { ActiveFlashSaleItem } from '@/lib/data/flash-sales';
import { retrieveCustomer } from '@/lib/data/customer';
import { getUserWishlists } from '@/lib/data/wishlist';
import type { AdditionalAttributeProps } from '@/types/product';
import type { SellerProps } from '@/types/seller';
import type { Wishlist } from '@/types/wishlist';

export const ProductDetails = async ({
	product,
	locale,
	seller,
	flashSaleItem,
	brand,
}: {
	product: HttpTypes.StoreProduct & {
		attribute_values?: AdditionalAttributeProps[];
	};
	locale: string;
	seller: SellerProps;
	flashSaleItem?: ActiveFlashSaleItem | null;
	brand?: { id: string; name: string; logo_url: string | null } | null;
}) => {
	const user = await retrieveCustomer();

	let wishlist: Wishlist[] = [];
	if (user) {
		try {
			const response = await getUserWishlists();
			wishlist = response.wishlists;
		} catch {
			wishlist = [];
		}
	}

	return (
		<div className="flex flex-col gap-5">
			<ProductDetailsHeader
				flashSaleItem={flashSaleItem ?? null}
				locale={locale}
				product={product}
				user={user}
				wishlist={wishlist}
			/>

			{brand && (
				<div className="flex items-center gap-2">
					{brand.logo_url && (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							alt={brand.name}
							className="h-7 w-7 rounded object-contain border border-black/10 bg-white"
							src={brand.logo_url}
						/>
					)}
					<span className="text-sm text-gray-500">
						Brand:{' '}
						<span className="font-semibold text-[#372248]">
							{brand.name}
						</span>
					</span>
				</div>
			)}

			<ProductDetailsSeller product={product} seller={seller} user={user} />

			<div className="flex flex-col gap-2.5">
				<ProductFreeDeliveryDetails />
				<ProductReturnDeliveryDetails />
			</div>

			<ProductAdditionalAttributes
				attributes={product?.attribute_values || []}
			/>
		</div>
	);
};
