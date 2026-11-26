import { SectionHeading, Reveal } from '@/components/motion';
import { retrieveCustomer } from '@/lib/data/customer';
import { searchProductsOrNothing } from '@/lib/data/search';
import { getUserWishlists } from '@/lib/data/wishlist';
import type { ProductCardData } from '@/types/search';

import { ProductRow } from './ProductRow';

/** More like this one: its category first, then the rest of its shop. */
export async function RelatedProducts({ productId, categoryIds, sellerHandle, heading }: { productId: string; categoryIds: string[]; sellerHandle?: string; heading: string }) {
	const ask = (params: Record<string, string>) => searchProductsOrNothing(new URLSearchParams({ limit: '14', ...params }).toString()).then((r) => r.products);
	const [similar, shop, user] = await Promise.all([
		categoryIds.length ? ask({ category_id: categoryIds[0] }) : Promise.resolve([] as ProductCardData[]),
		sellerHandle ? ask({ seller: sellerHandle }) : Promise.resolve([] as ProductCardData[]),
		retrieveCustomer(),
	]);
	const seen = new Set([productId]);
	const products = [...similar, ...shop].filter((p) => p.in_stock && !seen.has(p.id) && seen.add(p.id)).slice(0, 12);
	if (products.length < 2) return null;
	const wishlist = user ? await getUserWishlists().then((r) => r.wishlists).catch(() => []) : [];

	return (
		<section>
			<div className="mb-6">
				<SectionHeading className="font-serif text-[28px] tracking-[-0.01em] text-[#1B1B1B] lg:text-[34px]" text={heading} />
			</div>
			<Reveal>
				<ProductRow label={heading} products={products} user={user} wishlist={wishlist} />
			</Reveal>
		</section>
	);
}
