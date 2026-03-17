import type { HttpTypes } from '@medusajs/types';

import {
	ProductListingActiveFilters,
	ProductListingHeader,
	ProductSidebar,
	ProductsList,
} from '@/components/organisms';
import { ProductsPaginationWrapper } from '@/components/organisms/ProductsPagination/ProductsPaginationWrapper';
import { PRODUCT_LIMIT } from '@/const';
import { retrieveCustomer } from '@/lib/data/customer';
import { listCollections } from '@/lib/data/collections';
import { listProductsWithSort } from '@/lib/data/products';
import type { Wishlist } from '@/types/wishlist';
import { getUserWishlists } from '@/lib/data/wishlist';

type FilterParams = {
	min_price?: string;
	max_price?: string;
	color?: string;
	size?: string;
	brand?: string;
	page?: string;
};

function productMatchesPrice(
	product: HttpTypes.StoreProduct,
	min?: number,
	max?: number,
): boolean {
	if (!min && !max) return true;
	const prices = (product.variants ?? [])
		.map((v) => v.calculated_price?.calculated_amount)
		.filter((p): p is number => typeof p === 'number');
	if (!prices.length) return true;
	const lowest = Math.min(...prices);
	if (min && lowest < min) return false;
	if (max && lowest > max) return false;
	return true;
}

function productMatchesColor(
	product: HttpTypes.StoreProduct,
	colors: string[],
): boolean {
	if (!colors.length) return true;
	const lc = colors.map((c) => c.toLowerCase());
	// Check metadata
	if (
		product.metadata?.color &&
		lc.includes(String(product.metadata.color).toLowerCase())
	)
		return true;
	// Check variant options
	if (
		product.variants?.some((v) =>
			v.options?.some(
				(o) =>
					o.option?.title?.toLowerCase() === 'color' &&
					lc.includes((o.value ?? '').toLowerCase()),
			),
		)
	)
		return true;
	return false;
}

function productMatchesSize(
	product: HttpTypes.StoreProduct,
	sizes: string[],
): boolean {
	if (!sizes.length) return true;
	const lc = sizes.map((s) => s.toLowerCase());
	// Check variant options
	if (
		product.variants?.some((v) =>
			v.options?.some(
				(o) =>
					o.option?.title?.toLowerCase() === 'size' &&
					lc.includes((o.value ?? '').toLowerCase()),
			),
		)
	)
		return true;
	// Check metadata
	if (
		product.metadata?.size &&
		lc.includes(String(product.metadata.size).toLowerCase())
	)
		return true;
	return false;
}

export const ProductListing = async ({
	category_id,
	collection_id,
	seller_id,
	showSidebar = false,
	locale = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'pl',
	filterParams = {},
}: {
	category_id?: string;
	collection_id?: string;
	seller_id?: string;
	showSidebar?: boolean;
	locale?: string;
	filterParams?: FilterParams;
}) => {
	const { brand, color, size, min_price, max_price, page } = filterParams;

	// Brand filter selects a collection_id
	const activeCollectionId = brand || collection_id;

	const { response } = await listProductsWithSort({
		category_id,
		collection_id: activeCollectionId,
		countryCode: locale,
		queryParams: {
			limit: PRODUCT_LIMIT,
		},
		seller_id,
		sortBy: 'created_at',
	});

	let { products } = await response;

	// Client-side filters
	const minPrice = min_price ? Number(min_price) : undefined;
	const maxPrice = max_price ? Number(max_price) : undefined;
	const colors = color ? color.split(',').filter(Boolean) : [];
	const sizes = size ? size.split(',').filter(Boolean) : [];

	if (minPrice || maxPrice) {
		products = products.filter((p) => productMatchesPrice(p, minPrice, maxPrice));
	}
	if (colors.length) {
		products = products.filter((p) => productMatchesColor(p, colors));
	}
	if (sizes.length) {
		products = products.filter((p) => productMatchesSize(p, sizes));
	}

	const user = await retrieveCustomer();

	let wishlist: Wishlist[] = [];
	if (user) {
		try {
			const res = await getUserWishlists();
			wishlist = res.wishlists;
		} catch {
			wishlist = [];
		}
	}

	// Fetch brands (collections) for sidebar
	const { collections } = await listCollections();
	const brands = collections.map((c) => ({ id: c.id, title: c.title }));

	const count = products.length;
	const currentPage = page ? Number(page) : 1;
	const pages = Math.ceil(count / PRODUCT_LIMIT) || 1;

	return (
		<div className="py-4">
			<ProductListingHeader total={count} />
			<div className="hidden md:block">
				<ProductListingActiveFilters />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-4">
				{showSidebar && <ProductSidebar brands={brands} />}
				<section className={showSidebar ? 'col-span-3' : 'col-span-4'}>
					<div className="flex flex-wrap gap-4">
						<ProductsList
							products={products}
							user={user}
							wishlist={wishlist}
						/>
					</div>
					<ProductsPaginationWrapper pages={pages} />
				</section>
			</div>
		</div>
	);
};
