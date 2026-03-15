import {
	ProductListingActiveFilters,
	ProductListingHeader,
	ProductSidebar,
	ProductsList,
} from '@/components/organisms';
import { ProductsPaginationWrapper } from '@/components/organisms/ProductsPagination/ProductsPaginationWrapper';
import { PRODUCT_LIMIT } from '@/const';
import { retrieveCustomer } from '@/lib/data/customer';
import { listProductsWithSort } from '@/lib/data/products';
import { getUserWishlists } from '@/lib/data/wishlist';
import type { Wishlist } from '@/types/wishlist';

export const ProductListing = async ({
	category_id,
	collection_id,
	seller_id,
	showSidebar = false,
	locale = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'pl',
}: {
	category_id?: string;
	collection_id?: string;
	seller_id?: string;
	showSidebar?: boolean;
	locale?: string;
}) => {
	const { response } = await listProductsWithSort({
		category_id,
		collection_id,
		countryCode: locale,
		queryParams: {
			limit: PRODUCT_LIMIT,
		},
		seller_id,
		sortBy: 'created_at',
	});

	const { products } = await response;

	const user = await retrieveCustomer();

	let wishlist: Wishlist[] = [];
	if (user) {
		try {
			const response = await getUserWishlists();
			wishlist = response.wishlists;
		} catch (error) {
			console.warn('Failed to fetch wishlist:', error);
			wishlist = [];
		}
	}

	const count = products.length;

	const pages = Math.ceil(count / PRODUCT_LIMIT) || 1;

	return (
		<div className="py-4">
			<ProductListingHeader total={count} />
			<div className="hidden md:block">
				<ProductListingActiveFilters />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-4">
				{showSidebar && <ProductSidebar />}
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
