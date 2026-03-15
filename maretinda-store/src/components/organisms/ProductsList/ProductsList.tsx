import type { HttpTypes } from '@medusajs/types';

import { ProductCard } from '../ProductCard/ProductCard';
import type { Wishlist } from '@/types/wishlist';

export const ProductsList = ({
	products,
	user,
	wishlist,
}: {
	products: HttpTypes.StoreProduct[];
	user: HttpTypes.StoreCustomer | null;
	wishlist: Wishlist[];
}) => {
	return (
		<>
			{products.map((product) => (
				<ProductCard
					api_product={product}
					key={product.id}
					product={product}
					user={user}
					wishlist={wishlist}
				/>
			))}
		</>
	);
};
