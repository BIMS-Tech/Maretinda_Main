import { Suspense } from 'react';

import { TabsContent, TabsList } from '@/components/molecules';

// import { ProductsList } from "../ProductsList/ProductsList"
import { ProductsPaginationWrapper } from '../ProductsPagination/ProductsPaginationWrapper';
// import { listProducts } from "@/lib/data/products"

export const wishlistTabs = [
	{ label: 'All', link: '/wishlist' },
	{ label: 'Products', link: '/wishlist/products' },
	{ label: 'Collections', link: '/wishlist/collections' },
];

export const WishlistTabs = async ({ tab }: { tab: string }) => {
	// const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "gb"

	// const { response } = await listProducts({
	//   countryCode: DEFAULT_REGION,
	// })
	// const { products } = await response

	return (
		<div>
			<TabsList activeTab={tab} list={wishlistTabs} />
			<TabsContent activeTab={tab} value="all">
				<Suspense fallback={<>Loading...</>}>
					<div className="grid sm:grid-cols-2 xl:grid-cols-4 mt-8">
						{/* <ProductsList products={products} /> */}
					</div>
					<ProductsPaginationWrapper pages={2} />
				</Suspense>
			</TabsContent>
			<TabsContent activeTab={tab} value="products">
				<Suspense fallback={<>Loading...</>}>
					<div className="grid sm:grid-cols-2 xl:grid-cols-4 mt-8">
						{/* <ProductsList products={products} /> */}
					</div>
					<ProductsPaginationWrapper pages={2} />
				</Suspense>
			</TabsContent>
			<TabsContent activeTab={tab} value="collections">
				<Suspense fallback={<>Loading...</>}>
					<div className="grid sm:grid-cols-2 xl:grid-cols-4 mt-8">
						{/* <ProductsList products={products} /> */}
					</div>
					<ProductsPaginationWrapper pages={2} />
				</Suspense>
			</TabsContent>
		</div>
	);
};
