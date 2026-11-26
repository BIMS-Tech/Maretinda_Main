import NotFound from '@/app/not-found';
import { Breadcrumbs } from '@/components/atoms';
import { ReportButton } from '@/components/molecules/ReportButton/ReportButton';
import {
	ProductDetails,
	ProductGallery,
	ProductTabs,
} from '@/components/organisms';
import { RelatedProducts } from '@/components/organisms/ProductRow/RelatedProducts';
import { getProductBrand } from '@/lib/data/brands';
import { getClosedShopHandles } from '@/lib/data/closed-shops';
import { getFlashSaleForProduct } from '@/lib/data/flash-sales';
import { listProducts } from '@/lib/data/products';
import { getSellerByHandle } from '@/lib/data/seller';
import { sanitizeSellerHtml } from '@/lib/helpers/sanitize-html';
import { jsonLdScript, productJsonLd } from '@/lib/helpers/product-json-ld';
import type { SellerProps } from '@/types/seller';


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
			fields: '*variants.calculated_price,+variants.inventory_quantity,+seller.handle,+metadata,*reviews,*reviews.customer,*categories',
			handle,
		},
	}).then(({ response }) => response.products[0]);

	// A product that was renamed or taken down, not an empty page
	if (!prod) return NotFound();

	const [seller, flashSaleItem, brand, closedShops] = await Promise.all([
		getSellerByHandle(prod.seller?.handle as string) as Promise<SellerProps>,
		getFlashSaleForProduct(prod.id),
		getProductBrand(prod.id),
		getClosedShopHandles(),
	]);

	if (seller?.store_status === 'SUSPENDED') {
		return NotFound();
	}

	const descriptionHtml = prod.description ? sanitizeSellerHtml(prod.description) : '';
	const category = (prod as any).categories?.[0] as { name: string; handle: string } | undefined;
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
			<div className="mb-6 hidden md:block">
				<Breadcrumbs
					items={[
						{ label: 'Home', path: '/' },
						category ? { label: category.name, path: `/categories/${category.handle.trim()}` } : { label: 'Categories', path: '/categories' },
						{ label: prod.title, path: `/products/${prod.handle}` },
					]}
				/>
			</div>
			{/* Hero: gallery + product info */}
			<div className="flex flex-col gap-8 md:flex-row lg:gap-14">
				<div className="md:w-[46%]">
					<ProductGallery
						handle={prod.handle}
						images={prod.images ?? []}
						key={prod.id}
						productId={prod.id}
						thumbnail={prod.thumbnail}
						title={prod.title}
					/>
				</div>
				<div className="md:w-[54%]">
					<ProductDetails
						brand={brand}
						descriptionHtml={descriptionHtml}
						flashSaleItem={flashSaleItem}
						locale={locale}
						product={prod}
						seller={seller}
						shopClosed={closedShops.includes(seller?.handle)}
					/>
				</div>
			</div>

			{/* Tabs: details, reviews, shipping */}
			<ProductTabs descriptionHtml={descriptionHtml} product={prod} />

			<div className="mt-6 flex justify-end">
				<ReportButton kind="product" target={prod.id} />
			</div>

			{/* People Also Buy */}
			<div className="mb-8 mt-16">
				<RelatedProducts
					categoryIds={((prod as any).categories ?? []).map((c: { id: string }) => c.id)}
					heading="People Also Buy"
					productId={prod.id}
					sellerHandle={prod.seller?.handle}
				/>
			</div>
		</>
	);
};
