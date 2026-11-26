'use client';

import type { HttpTypes } from '@medusajs/types';
import Image from 'next/image';
import { useRef, useState } from 'react';

import { WishlistButton } from '@/components/cells/WishlistButton/WishlistButton';
import { peso } from '@/components/motion';
import { cardImage, groundOf } from '@/lib/helpers/card-image';
import { discountPercent } from '@/lib/helpers/product-card';
import { cn } from '@/lib/utils';
import type { ProductCardData } from '@/types/search';
import type { Wishlist } from '@/types/wishlist';

import { ProductLink } from './ProductLink';
import { useQuickAdd } from './useQuickAdd';

const Star = () => (
	<svg aria-hidden="true" fill="#FFC533" height="12" viewBox="0 0 24 24" width="12">
		<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
	</svg>
);

export const ProductCard = ({
	product,
	user,
	wishlist,
	priority = false,
}: {
	product: ProductCardData;
	user: HttpTypes.StoreCustomer | null;
	wishlist: Wishlist[];
	/** Pictures on screen at first */
	priority?: boolean;
}) => {
	const picture = useRef<HTMLDivElement>(null);
	const { add, canQuickAdd, state } = useQuickAdd(product, !!user);
	const [broken, setBroken] = useState(false);
	const image = broken ? null : cardImage(product.thumbnail);
	const off = discountPercent(product);
	const soldOut = !product.in_stock;
	const pictureEl = () => picture.current;

	return (
		<article className="group relative flex w-full flex-col" data-in-stock={product.in_stock} data-price={product.price ?? undefined} data-product={product.handle}>
			<div className="relative">
				<ProductLink picture={pictureEl} product={product} tabIndex={-1}>
					<div
						className="relative aspect-square w-full overflow-hidden rounded-[20px] transition-shadow duration-500 ease-soft group-hover:shadow-[0_18px_40px_-12px_rgba(67,44,99,0.22)]"
						ref={picture}
						style={{ backgroundColor: groundOf(product.id) }}
					>
						<Image
							alt={product.title}
							className={cn(
								// White photo backgrounds melt into the ground
								'object-contain p-4 mix-blend-multiply transition-transform duration-700 ease-soft group-hover:-translate-y-1 group-hover:scale-[1.06]',
								!image && 'opacity-25',
								soldOut && 'opacity-50 grayscale',
							)}
							fill
							onError={() => setBroken(true)}
							priority={priority}
							sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
							src={image || '/images/placeholder.svg'}
						/>
					</div>
				</ProductLink>

				<div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
					{off > 0 && (
						<span
							className={cn(
								'rounded-full px-2.5 py-1 text-[11px] font-bold leading-none text-white shadow-sm',
								product.flash_sale ? 'bg-[#D94040]' : 'bg-[#432C63]',
							)}
						>
							{product.flash_sale ? `Flash −${off}%` : `−${off}%`}
						</span>
					)}
					{soldOut && (
						<span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold leading-none text-[#5B5B5B] shadow-sm">Sold out</span>
					)}
				</div>

				<div className="absolute right-3 top-3 transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100 has-[[aria-pressed=true]]:opacity-100">
					<WishlistButton
						className="!h-9 !w-9 !p-0 !border-0 !bg-white/95 rounded-full shadow-sm"
						productId={product.id}
						user={user}
						wishlist={wishlist}
					/>
				</div>

				{!soldOut && (
					<div className="absolute bottom-3 right-3 transition-[opacity,transform] duration-400 ease-soft lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:focus-within:translate-y-0 lg:focus-within:opacity-100">
						{canQuickAdd ? (
							<button
								aria-label={`Add ${product.title} to cart`}
								className="press flex h-10 w-10 items-center justify-center rounded-full bg-[#432C63] text-white shadow-[0_8px_20px_rgba(67,44,99,0.35)] hover:bg-[#372248]"
								data-state={state}
								data-testid="quick-add"
								disabled={state === 'busy'}
								onClick={() => add(picture.current, image)}
								type="button"
							>
								{state === 'busy' ? (
									<span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
								) : (
									<svg aria-hidden="true" className="pop-in" fill="none" height="17" key={state} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.6" viewBox="0 0 24 24" width="17">
										<path d={state === 'done' ? 'M5 13l4 4L19 7' : 'M12 5v14M5 12h14'} />
									</svg>
								)}
							</button>
						) : (
							<ProductLink
								className="press flex h-10 items-center justify-center rounded-full bg-white px-4 text-[12px] font-bold text-[#432C63] shadow-[0_8px_20px_rgba(67,44,99,0.18)]"
								label={`Choose options for ${product.title}`}
								picture={pictureEl}
								product={product}
							>
								Options
							</ProductLink>
						)}
					</div>
				)}
			</div>

			<ProductLink className="flex flex-1 flex-col gap-1 px-1 pt-3" picture={pictureEl} product={product}>
				<span className="flex items-center gap-1.5 text-[11.5px] text-[#8A8493]">
					<span className="truncate">{product.brand || product.category?.name || product.seller?.name}</span>
					{product.seller?.verified && (
						<svg aria-label="Verified shop" className="shrink-0" fill="#432C63" height="12" role="img" viewBox="0 0 24 24" width="12">
							<path d="M12 1l2.6 2 3.2-.3 1 3.1 2.8 1.7-.6 3.2 1.4 2.9-2.3 2.3-.3 3.2-3.2.7-2.1 2.5L12 20.9l-2.5 1.4-2.1-2.5-3.2-.7-.3-3.2-2.3-2.3L3 10.7l-.6-3.2 2.8-1.7 1-3.1 3.2.3L12 1zm-1.2 14.6l6-6-1.4-1.4-4.6 4.6-2.2-2.2L7.200 12l3.6 3.6z" />
						</svg>
					)}
				</span>
				<h3 className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-[#1B1B1B]">
					<span className="link-line">{product.title}</span>
				</h3>
				<span className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1">
					<span className={cn('text-[15px] font-bold', product.flash_sale ? 'text-[#C43131]' : 'text-[#432C63]')}>
						{product.price != null ? peso(product.price) : 'View price'}
					</span>
					{off > 0 && <span className="text-[12px] text-[#A39DAC] line-through">{peso(product.original_price as number)}</span>}
				</span>
				{(product.review_count > 0 || product.sold > 0) && (
					<span className="flex items-center gap-1.5 text-[11.5px] text-[#737373]">
						{product.review_count > 0 && (
							<>
								<Star />
								<b className="font-semibold text-[#1B1B1B]">{product.rating.toFixed(1)}</b>
								<span>({product.review_count})</span>
							</>
						)}
						{product.review_count > 0 && product.sold > 0 && <span aria-hidden="true">·</span>}
						{product.sold > 0 && <span>{product.sold.toLocaleString('en-PH')} sold</span>}
					</span>
				)}
			</ProductLink>
		</article>
	);
};
