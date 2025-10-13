import type { HttpTypes } from '@medusajs/types';

import { ProductCard } from '../ProductCard/ProductCard';

export const ProductsList = ({
	products,
}: {
	products: HttpTypes.StoreProduct[];
}) => {
	return (
		<>
			{products.map((product) => (
				<ProductCard
					api_product={product}
					key={product.id}
					product={product}
				/>
			))}
		</>
	);
};
