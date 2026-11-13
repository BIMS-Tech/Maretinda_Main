import NotFound from '@/app/not-found';
import { ReportButton } from '@/components/molecules/ReportButton/ReportButton';
import {
	ProductDetails,
	ProductGallery,
	ProductTabs,
} from '@/components/organisms';
import { getProductBrand } from '@/lib/data/brands';
import { getClosedShopHandles } from '@/lib/data/closed-shops';
import { getFlashSaleForProduct } from '@/lib/data/flash-sales';
import { listProducts } from '@/lib/data/products';
import { getSellerByHandle } from '@/lib/data/seller';
import { jsonLdScript, productJsonLd } from '@/lib/helpers/product-json-ld';
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

	const [seller, flashSaleItem, brand, closedShops] = await Promise.all([
		getSellerByHandle(prod.seller?.handle as string) as Promise<SellerProps>,
		getFlashSaleForProduct(prod.id),
		getProductBrand(prod.id),
		getClosedShopHandles(),
	]);

	if (seller?.store_status === 'SUSPENDED') {
		return NotFound();
	}

	const shopOpen = !closedShops.includes(seller?.handle);
	const reviews = ((prod as any).reviews ?? []).filter((r: any) => r && typeof r.rating === 'number');
	const jsonLd = shopOpen
		? productJsonLd(prod as any, {
				brand: brand?.name,
				rating: reviews.length
					? {
							average: reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length,
							count: reviews.length,
						}
					: null,
				sellerName: seller?.name,
				url: `${(process.env.NEXT_PUBLIC_BASE_URL || 'https://maretinda.com').replace(/\/$/, '')}/${locale}/products/${prod.handle}`,
			})
		: null;

	return (
		<>
			{jsonLd && (
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: structured data for search engines, escaped by jsonLdScript
					dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
					type="application/ld+json"
				/>
			)}
			{/* Hero: gallery + product info */}
			<div className="flex flex-col md:flex-row gap-8 lg:gap-14">
				<div className="md:w-[46%]">
					<ProductGallery images={prod?.images || []} />
				</div>
				<div className="md:w-[54%]">
					<ProductDetails
						brand={brand}
						flashSaleItem={flashSaleItem}
						locale={locale}
						product={prod}
						seller={seller}
						shopClosed={closedShops.includes(seller?.handle)}
					/>
				</div>
			</div>

			{/* Tabs: details, reviews, shipping */}
			<ProductTabs product={prod} seller={seller} />

			<div className="mt-6 flex justify-end">
				<ReportButton kind="product" target={prod.id} />
			</div>

			{/* People Also Buy */}
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
