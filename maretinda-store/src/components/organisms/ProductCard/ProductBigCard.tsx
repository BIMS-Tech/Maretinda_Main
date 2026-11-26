'use client';

import type { HttpTypes } from '@medusajs/types';
import Image from 'next/image';
import { useRef } from 'react';

import { Avatar } from '@/components/atoms';
import { WishlistButton } from '@/components/cells/WishlistButton/WishlistButton';
import { MorphButton, peso } from '@/components/motion';
import { cardImage } from '@/lib/helpers/card-image';
import { discountPercent } from '@/lib/helpers/product-card';
import { cn } from '@/lib/utils';
import type { ProductCardData } from '@/types/search';
import type { Wishlist } from '@/types/wishlist';

import { ProductLink } from './ProductLink';
import { useQuickAdd } from './useQuickAdd';

/** A product as a row, with room for what it is and who sells it. */
export const ProductBigCard = ({
	product,
	user,
	wishlist,
}: {
	product: ProductCardData;
	user: HttpTypes.StoreCustomer | null;
	wishlist: Wishlist[];
}) => {
	const picture = useRef<HTMLDivElement>(null);
	const { add, canQuickAdd, state } = useQuickAdd(product, !!user);
	const image = cardImage(product.thumbnail);
	const off = discountPercent(product);
	const pictureEl = () => picture.current;

	return (
		<article className="group flex flex-col overflow-hidden rounded-[20px] border border-black/[0.06] bg-white transition-[box-shadow,border-color] duration-500 hover:border-[#432C63]/20 hover:shadow-[0_14px_36px_-12px_rgba(67,44,99,0.18)] sm:flex-row">
			<ProductLink className="relative w-full shrink-0 sm:w-[210px]" picture={pictureEl} product={product} tabIndex={-1}>
				<div className="relative aspect-[4/3] h-full w-full overflow-hidden bg-[#F3EFF8] sm:aspect-auto" ref={picture}>
					<Image
						alt={product.title}
						className="object-contain p-5 mix-blend-multiply transition-transform duration-700 ease-soft group-hover:scale-[1.06]"
						fill
						sizes="210px"
						src={image || '/images/placeholder.svg'}
					/>
				</div>
				{off > 0 && (
					<span className={cn('absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold leading-none text-white', product.flash_sale ? 'bg-[#D94040]' : 'bg-[#432C63]')}>
						−{off}%
					</span>
				)}
			</ProductLink>

			<div className="flex min-w-0 flex-1 flex-col px-5 py-4">
				<ProductLink picture={pictureEl} product={product}>
					<h3 className="line-clamp-2 text-[16px] font-bold leading-snug text-[#1B1B1B]">
						<span className="link-line">{product.title}</span>
					</h3>
				</ProductLink>
				<div className="mt-1.5 flex items-baseline gap-2">
					<span className={cn('text-[16px] font-bold', product.flash_sale ? 'text-[#C43131]' : 'text-[#432C63]')}>
						{product.price != null ? peso(product.price) : 'View price'}
					</span>
					{off > 0 && <span className="text-[13px] text-[#A39DAC] line-through">{peso(product.original_price as number)}</span>}
				</div>
				{product.review_count > 0 && (
					<p className="mt-1 text-[12px] text-[#737373]">
						<span className="text-[#E0A800]">★</span> <b className="font-semibold text-[#1B1B1B]">{product.rating.toFixed(1)}</b> ({product.review_count})
						{product.sold > 0 && ` · ${product.sold.toLocaleString('en-PH')} sold`}
					</p>
				)}
				{product.excerpt && <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#737373]">{product.excerpt}</p>}

				<div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
					{product.seller ? (
						<div className="flex min-w-0 items-center gap-2">
							<Avatar className="h-7 w-7 shrink-0 rounded-full" initials={product.seller.name.charAt(0).toUpperCase()} size="small" src={product.seller.photo ?? undefined} />
							<span className="truncate text-[12px] font-semibold text-[#404040]">{product.seller.name}</span>
						</div>
					) : <span />}
					<div className="flex shrink-0 items-center gap-2">
						<WishlistButton className="!h-9 !w-9 !p-0 rounded-full !border-black/[0.08]" productId={product.id} user={user} wishlist={wishlist} />
						{canQuickAdd ? (
							<MorphButton
								busy="Adding…"
								className="h-10 rounded-full bg-[#432C63] px-5 text-[12.5px] font-bold text-white"
								data-testid="quick-add"
								done="Added"
								idle="Add to cart"
								onClick={() => add(picture.current, image)}
								state={state}
								type="button"
							/>
						) : (
							<ProductLink className="press inline-flex h-10 items-center rounded-full bg-[#432C63] px-5 text-[12.5px] font-bold text-white" picture={pictureEl} product={product}>
								{product.in_stock ? 'Choose options' : 'View product'}
							</ProductLink>
						)}
					</div>
				</div>
			</div>
		</article>
	);
};
