import type { HttpTypes } from '@medusajs/types';

import type { SellerProps } from '@/types/seller';
import type { ProductCardData } from '@/types/search';

type Variant = HttpTypes.StoreProductVariant & { manage_inventory?: boolean | null; allow_backorder?: boolean | null };

/**
 * Whether a variant can be bought. Stock the shop doesn't track never runs
 * out, and its count is empty: reading that as zero showed such products as
 * out of stock.
 */
export const variantInStock = (variant: Variant | null | undefined): boolean =>
	!!variant && (variant.manage_inventory === false || !!variant.allow_backorder || (variant.inventory_quantity ?? 0) > 0);

/** A card from a product of Medusa's own product list. */
export function cardFromProduct(
	product: HttpTypes.StoreProduct & { seller?: SellerProps; reviews?: any[]; brand?: { name?: string } | null },
): ProductCardData {
	const variants = (product.variants ?? []) as Variant[];
	const priced = variants
		.filter((v) => v.calculated_price?.calculated_amount != null)
		.sort((a, b) => Number(a.calculated_price!.calculated_amount) - Number(b.calculated_price!.calculated_amount));
	const cheapest = priced[0]?.calculated_price;
	const reviews = (product.reviews ?? []).filter((r: any) => r && r.reference === 'product' && typeof r.rating === 'number');
	const seller = product.seller as (SellerProps & { verification_status?: string }) | undefined;
	const category = product.categories?.[0];

	return {
		brand: product.brand?.name ?? null,
		category: category ? { handle: category.handle, name: category.name } : null,
		created_at: String(product.created_at ?? ''),
		currency_code: cheapest?.currency_code ?? 'php',
		excerpt: String(product.description ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180),
		flash_sale: false,
		handle: product.handle,
		id: product.id,
		in_stock: variants.some(variantInStock),
		original_price: cheapest?.original_amount != null ? Number(cheapest.original_amount) : null,
		price: cheapest?.calculated_amount != null ? Number(cheapest.calculated_amount) : null,
		rating: reviews.length ? Math.round((reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0,
		review_count: reviews.length,
		seller: seller?.handle
			? {
					handle: seller.handle,
					id: seller.id,
					name: seller.name,
					photo: seller.photo ?? null,
					verified: seller.verification_status === 'verified',
				}
			: null,
		sold: 0,
		thumbnail: product.thumbnail ?? null,
		title: product.title,
		variant_count: variants.length,
		variant_id: variants.length === 1 ? variants[0].id : null,
	};
}

export const discountPercent = (p: Pick<ProductCardData, 'price' | 'original_price'>): number =>
	p.price != null && p.original_price != null && p.original_price > p.price
		? Math.round(((p.original_price - p.price) / p.original_price) * 100)
		: 0;
