/** A product as a card shows it (GET /store/search). */
export type ProductCardData = {
	id: string;
	title: string;
	handle: string;
	thumbnail: string | null;
	price: number | null;
	original_price: number | null;
	currency_code: string;
	flash_sale: boolean;
	in_stock: boolean;
	variant_count: number;
	/** The only variant, when there is nothing to choose */
	variant_id: string | null;
	rating: number;
	review_count: number;
	sold: number;
	brand: string | null;
	category: { name: string; handle: string } | null;
	seller: { id: string; name: string; handle: string; photo: string | null; verified: boolean } | null;
	created_at: string;
	excerpt: string;
};

export type FacetValue = { value: string; label: string; count: number; selected: boolean };
export type Facet = { name: string; label: string; values: FacetValue[] };

export const SORTS = ['relevance', 'popular', 'newest', 'price_asc', 'price_desc', 'rating', 'best_selling', 'discount'] as const;
export type Sort = (typeof SORTS)[number];

export type SearchResponse = {
	products: ProductCardData[];
	count: number;
	page: number;
	pages: number;
	limit: number;
	sort: Sort;
	currency_code: string;
	facets: Facet[];
	/** scale: how far the slider bends towards the cheap end */
	price: { min: number; max: number; scale: 1 | 2 | 3; histogram: number[] } | null;
	rating_counts: Record<string, number>;
	on_sale_count: number;
	in_stock_count: number;
	verified_count: number;
	relaxed: boolean;
	did_you_mean: string | null;
};

export type Suggestion = { name: string; handle: string; count: number; photo?: string | null };

export type SuggestResponse = {
	query: string;
	count: number;
	relaxed: boolean;
	did_you_mean: string | null;
	currency_code: string;
	products: ProductCardData[];
	categories: Suggestion[];
	brands: Suggestion[];
	shops: Suggestion[];
};

/** What a listing is limited to, besides the shopper's own filters. */
export type ListingScope = { category_id?: string; collection_id?: string; seller?: string };
