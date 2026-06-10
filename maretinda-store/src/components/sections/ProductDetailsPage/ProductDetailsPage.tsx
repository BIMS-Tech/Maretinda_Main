import NotFound from '@/app/not-found';
import {
	ProductDetails,
	ProductGallery,
	ProductTabs,
} from '@/components/organisms';
import { getFlashSaleForProduct } from '@/lib/data/flash-sales';
import { listProducts } from '@/lib/data/products';
import { getSellerByHandle } from '@/lib/data/seller';
import type { SellerProps } from '@/types/seller';

import { HomeProductSection } from '../HomeProductSection/HomeProductSection';

export const ProductDetailsPage = async ({
	handle,
	locale,
}: {
	handle: string;
	locale: string;
}) => {
	const prod = await listProducts({
		countryCode: locale,
		queryParams: {
			fields: '*variants.calculated_price,+variants.inventory_quantity,+seller.handle,+metadata,*reviews,*reviews.customer',
			handle,
		},
	}).then(({ response }) => response.products[0]);

	if (!prod) return null;

	const [seller, flashSaleItem] = await Promise.all([
		getSellerByHandle(prod.seller?.handle as string) as Promise<SellerProps>,
		getFlashSaleForProduct(prod.id),
	]);

	if (seller?.store_status === 'SUSPENDED') {
		return NotFound();
	}

	return (
		<>
			<div className="flex flex-col md:flex-row gap-8 lg:gap-16">
				<div className="md:w-[48%] lg:w-[45%]">
					<ProductGallery images={prod?.images || []} />
				</div>
				<div className="md:w-[52%] lg:w-[55%]">
					<ProductDetails
						flashSaleItem={flashSaleItem}
						locale={locale}
						product={prod}
						seller={seller}
					/>
				</div>
			</div>
			<ProductTabs product={prod} seller={seller} />
			<div className="mt-14 mb-8">
				<HomeProductSection
					heading="People Also Buy"
					locale={locale}
					products={prod.seller?.products}
					seller_handle={prod.seller?.handle}
				/>
			</div>
		</>
	);
};
