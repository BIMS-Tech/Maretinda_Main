'use client';

import type { HttpTypes } from '@medusajs/types';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import Image from 'next/image';
import { useRef, useState } from 'react';

import { peso } from '@/components/motion/AnimatedNumber';
import { SPRING } from '@/components/motion/tokens';
import { ProductLink } from '@/components/organisms/ProductCard/ProductLink';
import { notify } from '@/lib/cart-feedback';
import { addWishlistItem, removeWishlistItem } from '@/lib/data/wishlist';
import { cardImage, groundOf } from '@/lib/helpers/card-image';
import { variantInStock } from '@/lib/helpers/product-card';
import { useLanguage } from '@/providers/LanguageProvider';

export type WishlistProduct = HttpTypes.StoreProduct & { calculated_amount?: number | null; seller?: { verification_status?: string } };

/** The wishlist doesn't always carry stock counts; not knowing isn't "out of stock" */
const inStock = (product: WishlistProduct) => {
	const variants = (product.variants ?? []) as any[];
	return !variants.length || variants.some((v) => variantInStock(v) || (v.inventory_quantity == null && v.manage_inventory == null));
};

const Card = ({ product, onRemove, removeLabel }: { product: WishlistProduct; onRemove: () => void; removeLabel: string }) => {
	const picture = useRef<HTMLDivElement>(null);
	const [broken, setBroken] = useState(false);
	const { t } = useLanguage();
	const image = broken ? null : cardImage(product.thumbnail);
	const card = { handle: product.handle as string, id: product.id, original_price: null, price: product.calculated_amount ?? null, thumbnail: product.thumbnail ?? null, title: product.title as string };
	const available = inStock(product);
	return (
		<div className="group relative">
			<ProductLink picture={() => picture.current} product={card}>
				<div
					className="relative aspect-square w-full overflow-hidden rounded-[20px] transition-shadow duration-500 ease-soft group-hover:shadow-[0_18px_40px_-12px_rgba(67,44,99,0.22)]"
					ref={picture}
					style={{ backgroundColor: groundOf(product.id) }}
				>
					<Image
						alt={product.title as string}
						className={`object-contain p-4 mix-blend-multiply transition-transform duration-700 ease-soft group-hover:-translate-y-1 group-hover:scale-[1.06] ${image ? '' : 'opacity-25'} ${available ? '' : 'opacity-50 grayscale'}`}
						fill
						onError={() => setBroken(true)}
						sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
						src={image || '/images/placeholder.svg'}
					/>
				</div>
				<h3 className="mt-3 line-clamp-2 px-1 text-[13.5px] font-semibold leading-snug text-[#1B1B1B]">
					<span className="link-line">{product.title}</span>
				</h3>
				<p className="mt-1 flex flex-wrap items-baseline gap-x-2 px-1">
					<span className="text-[15px] font-bold text-[#432C63]">{product.calculated_amount != null ? peso(product.calculated_amount) : t.wishlist.viewPrice}</span>
					{!available && <span className="text-[12px] font-semibold text-[#C43131]">{t.wishlist.outOfStock}</span>}
				</p>
			</ProductLink>
			<button
				aria-label={removeLabel}
				className="press absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#432C63] shadow-sm transition-colors hover:bg-[#D94040] hover:text-white"
				onClick={onRemove}
				type="button"
			>
				<svg aria-hidden="true" fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" viewBox="0 0 24 24" width="15">
					<path d="M6 6l12 12M18 6L6 18" />
				</svg>
			</button>
		</div>
	);
};

/** Taking something off the wishlist closes the gap at once, and can be undone. */
export const WishlistGrid = ({ products }: { products: WishlistProduct[] }) => {
	const { t } = useLanguage();
	const s = t.wishlist;
	const [gone, setGone] = useState<string[]>([]);
	const back = (id: string) => setGone((list) => list.filter((g) => g !== id));

	const undo = async (product: WishlistProduct) => {
		back(product.id);
		const result = await addWishlistItem({ reference: 'product', reference_id: product.id }).catch(() => ({ ok: false }));
		if (!result.ok) notify({ title: s.failed, tone: 'error' });
	};
	const remove = async (product: WishlistProduct) => {
		setGone((list) => [...list, product.id]);
		const result = await removeWishlistItem({ product_id: product.id }).catch(() => ({ ok: false }));
		if (result.ok) notify({ action: { label: s.undo, onClick: () => undo(product) }, title: s.removed, tone: 'success' });
		else {
			back(product.id);
			notify({ title: s.failed, tone: 'error' });
		}
	};

	return (
		<ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
			<AnimatePresence initial={false} mode="popLayout">
				{products
					.filter((p) => !gone.includes(p.id))
					.map((product) => (
						<m.li animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.86 }} initial={{ opacity: 0, scale: 0.92 }} key={product.id} layout transition={SPRING}>
							<Card onRemove={() => remove(product)} product={product} removeLabel={s.remove} />
						</m.li>
					))}
			</AnimatePresence>
		</ul>
	);
};
