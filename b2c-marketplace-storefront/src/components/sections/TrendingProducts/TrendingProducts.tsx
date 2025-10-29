import Heading from '@/components/atoms/Heading/Heading';
import { listProducts } from '@/lib/data/products';
import type { Product } from '@/types/product';

import TrendingProductsCarousel from './TrendingProductsCarousel';

export const TrendingProducts = async ({
	locale = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'pl',
	sellerProducts = [],
}: {
	locale?: string;
	sellerProducts?: Product[];
}) => {
	const {
		response: { products },
	} = await listProducts({
		countryCode: locale,
		queryParams: {
			limit: 99999,
			order: 'created_at',
		},
	});

	const finalProducts = (
		sellerProducts.length ? sellerProducts : products
	) as Product[];

	return (
		<div className="w-full">
			<div className="mb-10">
				<Heading label="Trending Products" />
			</div>
			<TrendingProductsCarousel finalProducts={finalProducts} />
		</div>
	);
};
