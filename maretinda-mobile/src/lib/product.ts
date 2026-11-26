import type { Product, ProductCardData, ProductVariant } from '@/types';

/** A variant's choices by option name, e.g. { size: "XL" }. */
export type Choice = Record<string, string>;

export const variantInStock = (v: ProductVariant): boolean =>
  v.manage_inventory === false || !!v.allow_backorder || v.inventory_quantity == null || v.inventory_quantity > 0;

export const choiceOf = (v: ProductVariant | undefined): Choice =>
  Object.fromEntries((v?.options ?? []).map((o) => [(o.option?.title ?? '').toLowerCase(), o.value]));

/** The variant with exactly these choices. */
export const variantFor = (variants: ProductVariant[], choice: Choice): ProductVariant | undefined =>
  variants.find((v) => (v.options ?? []).every((o) => choice[(o.option?.title ?? '').toLowerCase()] === o.value));

/** The choices after picking a value; the others move to a combination that is sold. */
export function pickValue(variants: ProductVariant[], choice: Choice, option: string, value: string): Choice {
  const wanted = { ...choice, [option]: value };
  if (variantFor(variants, wanted)) return wanted;
  const same = (v: ProductVariant) => Object.entries(choiceOf(v)).filter(([k, x]) => wanted[k] === x).length;
  const best = variants
    .filter((v) => choiceOf(v)[option] === value)
    .sort((a, b) => Number(variantInStock(b)) - Number(variantInStock(a)) || same(b) - same(a))[0];
  return best ? choiceOf(best) : wanted;
}

/** The cheapest variant that can be bought, which is what a product opens with. */
export function openingVariant(variants: ProductVariant[]): ProductVariant | undefined {
  const price = (v: ProductVariant) => v.calculated_price?.calculated_amount ?? Number.MAX_SAFE_INTEGER;
  return [...variants].sort((a, b) => Number(variantInStock(b)) - Number(variantInStock(a)) || price(a) - price(b))[0];
}

/** A whole product, or one on a wishlist, as a card shows it. */
export function toCard(p: Product): ProductCardData {
  const variant = openingVariant(p.variants ?? []);
  const price = variant?.calculated_price;
  return {
    brand: null,
    category: p.categories?.[0] ?? null,
    currency_code: price?.currency_code ?? 'php',
    flash_sale: false,
    handle: p.handle,
    id: p.id,
    in_stock: !p.variants?.length || p.variants.some(variantInStock),
    original_price: price?.original_amount ?? null,
    price: price?.calculated_amount ?? p.calculated_amount ?? null,
    rating: 0,
    review_count: 0,
    seller: p.seller ? { handle: p.seller.handle, id: p.seller.id, name: p.seller.name, verified: false } : null,
    sold: 0,
    thumbnail: p.thumbnail ?? null,
    title: p.title,
    variant_id: p.variants?.length === 1 ? p.variants[0].id : null,
  };
}

export const discountPercent = (p: Pick<ProductCardData, 'price' | 'original_price'>): number =>
  p.price != null && p.original_price && p.original_price > p.price ? Math.round((1 - p.price / p.original_price) * 100) : 0;

/** Descriptions are written with a rich editor; the app shows their words. */
export const plainText = (html: string | undefined): string =>
  (html ?? '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/(p|div|li|h[1-6]|tr)>|<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
