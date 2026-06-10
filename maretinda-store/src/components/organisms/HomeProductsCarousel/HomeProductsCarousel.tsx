import type { HttpTypes } from '@medusajs/types';

import { Carousel } from '@/components/cells';
import { retrieveCustomer } from '@/lib/data/customer';
import { listProducts } from '@/lib/data/products';
import { getUserWishlists } from '@/lib/data/wishlist';
import { getProductPrice } from '@/lib/helpers/get-product-price';
import type { Product } from '@/types/product';
import type { Wishlist } from '@/types/wishlist';

import { ProductCard } from '../ProductCard/ProductCard';

export const HomeProductsCarousel = async ({
	locale,
	sellerProducts,
	home,
}: {
	locale: string;
	sellerProducts: Product[];
	home: boolean;
}) => {
	const {
		response: { products },
	} = await listProducts({
		countryCode: locale,
		queryParams: {
			limit: home ? 4 : 99999,
			order: 'created_at',
		},
	});

	const user = await retrieveCustomer();

	let wishlist: Wishlist[] = [];
	if (user) {
		try {
			const response = await getUserWishlists();
			wishlist = response.wishlists;
		} catch {
			wishlist = [];
		}
	}

	const source = sellerProducts.length ? sellerProducts : products;

	if (!source.length) return null;

	return (
		<div className="flex justify-center w-full">
			<Carousel
				align="start"
				items={source.map((product) => {
					const apiProd = home
						? (product as HttpTypes.StoreProduct)
						: (products.find((p) => {
								const { cheapestPrice } = getProductPrice({
									product: p,
								});
								return (
									cheapestPrice &&
									p.id === product.id &&
									Boolean(cheapestPrice)
								);
							}) ?? (product as HttpTypes.StoreProduct));

					return (
						<div
							key={product.id}
							className="flex-[0_0_72%] sm:flex-[0_0_50%] md:flex-[0_0_34%] lg:flex-[0_0_25%] min-w-0 px-2"
						>
							<ProductCard
								api_product={apiProd as HttpTypes.StoreProduct}
								product={apiProd as HttpTypes.StoreProduct}
								user={user}
								wishlist={wishlist}
							/>
						</div>
					);
				})}
			/>
		</div>
	);
};
