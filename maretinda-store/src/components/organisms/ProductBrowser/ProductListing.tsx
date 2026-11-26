import { retrieveCustomer } from '@/lib/data/customer';
import { searchProducts } from '@/lib/data/search';
import { getUserWishlists } from '@/lib/data/wishlist';
import { listingRequest, readListing, toSearchParams } from '@/lib/listing';
import type { ListingScope } from '@/types/search';
import type { Wishlist } from '@/types/wishlist';

import { ProductBrowser } from './ProductBrowser';

/**
 * A listing with its first page already in it, so it reads without JavaScript
 * and search engines see the products.
 */
export async function ProductListing({
	scope = {},
	searchParams = {},
	hideFilters,
	emptyHref,
}: {
	scope?: ListingScope;
	searchParams?: Record<string, string | string[] | undefined>;
	hideFilters?: string[];
	emptyHref?: string;
}) {
	const request = listingRequest(readListing(toSearchParams(searchParams)), scope);
	const [initial, user] = await Promise.all([
		searchProducts(request).catch((error) => {
			console.error('[listing]', error?.message ?? error);
			return null;
		}),
		retrieveCustomer(),
	]);
	const wishlist: Wishlist[] = user ? await getUserWishlists().then((r) => r.wishlists).catch(() => []) : [];

	return (
		<ProductBrowser
			emptyHref={emptyHref}
			hideFilters={hideFilters}
			initial={initial}
			initialRequest={request}
			scope={scope}
			user={user}
			wishlist={wishlist}
		/>
	);
}
