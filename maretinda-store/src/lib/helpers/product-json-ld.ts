type Variant = {
	calculated_price?: { calculated_amount?: number | null; currency_code?: string | null } | null;
	inventory_quantity?: number | null;
	manage_inventory?: boolean | null;
	allow_backorder?: boolean | null;
};

type ProductLike = {
	title?: string | null;
	handle?: string | null;
	description?: string | null;
	thumbnail?: string | null;
	images?: { url: string }[] | null;
	variants?: Variant[] | null;
};

/**
 * The product described for search engines (schema.org Product), so results
 * can show its price and whether it is in stock. Returns null when the
 * product has no price to state.
 */
export function productJsonLd(
	product: ProductLike,
	opts: { url: string; sellerName?: string | null; brand?: string | null; rating?: { average: number; count: number } | null },
): Record<string, unknown> | null {
	const priced = (product.variants ?? []).filter(
		(v) => typeof v.calculated_price?.calculated_amount === 'number',
	);
	if (!product.title || priced.length === 0) return null;

	const cheapest = priced.reduce((a, b) =>
		(a.calculated_price!.calculated_amount as number) <= (b.calculated_price!.calculated_amount as number) ? a : b,
	);
	const inStock = (product.variants ?? []).some(
		(v) => v.manage_inventory === false || v.allow_backorder === true || (v.inventory_quantity ?? 0) > 0,
	);
	const images = [product.thumbnail, ...(product.images ?? []).map((i) => i.url)].filter(
		(url, i, all): url is string => !!url && all.indexOf(url) === i,
	);

	return {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: product.title,
		...(product.description ? { description: product.description.slice(0, 5000) } : {}),
		...(images.length ? { image: images.slice(0, 8) } : {}),
		...(opts.brand ? { brand: { '@type': 'Brand', name: opts.brand } } : {}),
		...(opts.rating && opts.rating.count > 0
			? {
					aggregateRating: {
						'@type': 'AggregateRating',
						ratingValue: Math.round(opts.rating.average * 10) / 10,
						reviewCount: opts.rating.count,
					},
				}
			: {}),
		offers: {
			'@type': 'Offer',
			availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
			price: cheapest.calculated_price!.calculated_amount,
			priceCurrency: (cheapest.calculated_price!.currency_code || 'PHP').toUpperCase(),
			url: opts.url,
			...(opts.sellerName ? { seller: { '@type': 'Organization', name: opts.sellerName } } : {}),
		},
	};
}

/** JSON safe to place inside a script tag. */
export const jsonLdScript = (data: Record<string, unknown>) =>
	JSON.stringify(data).replace(/</g, '\\u003c');
