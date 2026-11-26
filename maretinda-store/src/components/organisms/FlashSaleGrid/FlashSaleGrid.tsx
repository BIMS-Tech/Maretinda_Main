import { Reveal } from '@/components/motion';
import { retrieveCustomer } from '@/lib/data/customer';
import type { FlashSaleItem } from '@/lib/data/flash-sales';
import { searchProductsOrNothing } from '@/lib/data/search';
import { getUserWishlists } from '@/lib/data/wishlist';
import { cn } from '@/lib/utils';

import { ProductCard } from '../ProductCard/ProductCard';
import { StockBar } from './StockBar';

/** The deals of a flash sale, at the price the cart will charge, in shops that are open. */
export async function FlashSaleGrid({ items, limit, className }: { items: FlashSaleItem[]; limit?: number; className?: string }) {
	const [{ products }, user] = await Promise.all([searchProductsOrNothing('on_sale=1&limit=60&sort=discount'), retrieveCustomer()]);
	const wishlist = user ? await getUserWishlists().then((r) => r.wishlists).catch(() => []) : [];
	const byId = new Map(products.map((p) => [p.id, p]));
	const deals = items
		.flatMap((item) => {
			const product = byId.get(item.product_id);
			return product ? [{ item, product }] : [];
		})
		.slice(0, limit);
	if (!deals.length) return null;

	return (
		<Reveal as="ul" className={cn('grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6', className)} variant="group">
			{deals.map(({ item, product }) => (
				<li key={item.id}>
					<ProductCard product={product} user={user} wishlist={wishlist} />
					{!!item.stock_limit && <StockBar limit={item.stock_limit} sold={item.sold_count} />}
				</li>
			))}
		</Reveal>
	);
}
