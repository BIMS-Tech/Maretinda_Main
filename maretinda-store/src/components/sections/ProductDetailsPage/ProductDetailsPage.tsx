import NotFound from '@/app/not-found';
import {
	ProductDetails,
	ProductGallery,
	ProductTabs,
} from '@/components/organisms';
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

	const seller = (await getSellerByHandle(
		prod.seller?.handle as string,
	)) as SellerProps;

	if (!prod) return null;

	if (seller.store_status === 'SUSPENDED') {
		return NotFound();
	}

	return (
		<>
			<div className="flex flex-col md:flex-row gap-5 lg:gap-14">
				<div className="md:w-1/2 ">
					<ProductGallery images={prod?.images || []} />
				</div>
				<div className="md:w-1/2 ">
					<ProductDetails
						locale={locale}
						product={prod}
						seller={seller}
					/>
				</div>
			</div>
			<ProductTabs product={prod} seller={seller} />
			<div className="my-8 mt-16">
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
