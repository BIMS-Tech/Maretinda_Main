'use client';

import type { HttpTypes } from '@medusajs/types';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';

import { StarRating } from '@/components/atoms';
import { AnimatedPeso, EASE_OUT, MaskedText, MorphButton, type MorphState, peso } from '@/components/motion';
import { FlashSaleCountdown } from '@/components/sections/FlashSaleSection/FlashSaleCountdown';
import { ErrorMessage, ProductVariants, ShareButton } from '@/components/molecules';
import { flyToCart, notifyAdded } from '@/lib/cart-feedback';
import { addToCart, addFlashSaleItemToCart } from '@/lib/data/cart';
import type { ActiveFlashSaleItem } from '@/lib/data/flash-sales';
import { cardImage } from '@/lib/helpers/card-image';
import { isSaleLive, msUntilSaleEnds } from '@/lib/helpers/flash-sale-window';
import { variantInStock } from '@/lib/helpers/product-card';
import { type Choice, openingChoice, pickValue, variantFor } from '@/lib/product-options';
import { cn } from '@/lib/utils';
import { openingProduct } from '@/lib/view-transition';
import type { SellerProps } from '@/types/seller';
import type { Wishlist } from '@/types/wishlist';

import { WishlistButton } from '../WishlistButton/WishlistButton';

/** "Only 3 left" from here down. */
const FEW_LEFT = 5;

export const ProductDetailsHeader = ({
	product,
	locale,
	user,
	wishlist,
	flashSaleItem: cachedFlashSaleItem,
	shopClosed = false,
	descriptionHtml = '',
}: {
	/** Already cleaned: the sanitiser is too big to send to the browser */
	descriptionHtml?: string;
	product: HttpTypes.StoreProduct & { seller?: SellerProps; reviews?: any[] };
	locale: string;
	user: HttpTypes.StoreCustomer | null;
	wishlist?: Wishlist[];
	flashSaleItem?: ActiveFlashSaleItem | null;
	/** The seller's plan has ended, so the shop can't take orders. */
	shopClosed?: boolean;
}) => {
	// The page can outlive the sale; switch back to the regular price when it ends
	const [saleEnded, setSaleEnded] = useState(
		() => !!cachedFlashSaleItem && !isSaleLive(cachedFlashSaleItem),
	);
	useEffect(() => {
		if (!cachedFlashSaleItem || saleEnded) return;
		const ms = msUntilSaleEnds(cachedFlashSaleItem.ends_at);
		if (ms > 2_147_483_647) return; // beyond setTimeout's range; the page reloads first
		const timer = setTimeout(() => setSaleEnded(true), ms);
		return () => clearTimeout(timer);
	}, [cachedFlashSaleItem, saleEnded]);
	// Once its units are gone the sale is over for this product too
	const [saleSoldOut, setSaleSoldOut] = useState(
		() =>
			!!cachedFlashSaleItem &&
			cachedFlashSaleItem.stock_limit != null &&
			cachedFlashSaleItem.sold_count >= cachedFlashSaleItem.stock_limit,
	);
	const flashSaleItem = saleEnded || saleSoldOut ? null : cachedFlashSaleItem;

	const [state, setState] = useState<MorphState>('idle');
	const [, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [quantity, setQuantity] = useState(1);
	const searchParams = useSearchParams();
	const router = useRouter();
	// The loading page already played the title's entrance
	const [arriving] = useState(() => !!openingProduct(product.handle));
	const resting = useRef<ReturnType<typeof setTimeout>>(undefined);

	const productReviews =
		product.reviews?.filter(
			(rev: any) => rev !== null && rev.reference === 'product',
		) || [];
	const reviewCount = productReviews.length;
	const averageRating =
		reviewCount > 0
			? productReviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
				reviewCount
			: 0;

	const [choice, setChoice] = useState<Choice>(() => openingChoice(product.variants, Object.fromEntries(searchParams.entries())));
	const variant = variantFor(product.variants, choice) as (HttpTypes.StoreProductVariant & { manage_inventory?: boolean }) | undefined;
	const variantId = variant?.id ?? '';

	const pick = (option: string, value: string) => {
		const next = pickValue(product.variants, choice, option, value);
		setChoice(next);
		setError(null);
		setQuantity(1);
		// The link shows the choice, so it can be shared, without loading the page again
		const params = new URLSearchParams(window.location.search);
		for (const [name, chosen] of Object.entries(next)) params.set(name, chosen);
		window.history.replaceState(null, '', `${window.location.pathname}?${params}`);
	};

	const price = variant?.calculated_price?.calculated_amount != null ? Number(variant.calculated_price.calculated_amount) : null;
	const originalPrice = variant?.calculated_price?.original_amount != null ? Number(variant.calculated_price.original_amount) : price;
	const inStock = variantInStock(variant);
	const left = variant && variant.manage_inventory !== false ? (variant.inventory_quantity ?? 0) : null;
	const canBuy = inStock && price != null && price > 0 && !shopClosed;
	const most = left != null && !variant?.allow_backorder ? Math.max(1, left) : 100;

	const handleAddToCart = () => {
		if (!variantId || state === 'busy') return;
		if (!user) {
			const currentPath = window.location.pathname + window.location.search;
			router.push(`/user?returnTo=${encodeURIComponent(currentPath)}`);
			return;
		}
		setState('busy');
		setError(null);
		const landed = flyToCart(document.querySelector('[data-product-hero] img'), cardImage(product.thumbnail ?? product.images?.[0]?.url));
		startTransition(async () => {
			const result = flashSaleItem
				? await addFlashSaleItemToCart({ countryCode: locale, flashSaleItemId: flashSaleItem.id, quantity, variantId })
				: await addToCart({ countryCode: locale, quantity, variantId });
			await landed;
			if (result.code === 'flash_sale_sold_out') {
				setSaleSoldOut(true);
				setError('The flash sale just sold out. Add to cart again at the regular price.');
				setState('idle');
				return;
			}
			if (result.error) {
				setError(result.error);
				setState('idle');
				return;
			}
			setState('done');
			notifyAdded(product.title);
			clearTimeout(resting.current);
			resting.current = setTimeout(() => setState('idle'), 1700);
		});
	};

	const flashSalePrice =
		flashSaleItem && originalPrice
			? flashSaleItem.discount_type === 'percentage'
				? Math.round(originalPrice * (1 - Number(flashSaleItem.discount_value) / 100))
				: Math.max(0, Math.round(originalPrice - Number(flashSaleItem.discount_value)))
			: null;
	const shownPrice = flashSalePrice ?? price;
	const discount = shownPrice != null && originalPrice && originalPrice > shownPrice ? Math.round(((originalPrice - shownPrice) / originalPrice) * 100) : 0;
	// Coming from a card, the loading page has already led in: don't keep them waiting twice
	const rise = (ms: number) => ({ className: 'rise-in', style: { '--delay': `${arriving ? ms / 5 : ms}ms` } as React.CSSProperties });

	return (
		<div className="flex flex-col gap-5">
			{/* Title + Rating */}
			<div className="flex flex-col gap-2">
				<h1 className="font-serif text-[32px] leading-[1.12] tracking-[-0.01em] text-[#1B1B1B] lg:text-[42px]">
					<MaskedText play={!arriving} text={product.title} />
				</h1>
				<div {...rise(120)}>
					{reviewCount > 0 ? (
						<div className="flex items-center gap-2">
							<StarRating rate={averageRating} starSize={14} />
							<span className="text-[13px] font-bold text-[#432C63]">{averageRating.toFixed(1)}</span>
							<span className="text-[13px] text-gray-400">
								({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
							</span>
						</div>
					) : (
						<span className="text-[12.5px] text-gray-400">No reviews yet</span>
					)}
				</div>
			</div>

			{/* Flash sale banner */}
			{flashSaleItem && flashSalePrice !== null && (
				<div {...rise(160)}>
					<div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#FDEEEE] px-4 py-3">
						<div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#C43131]">
							<svg aria-hidden="true" fill="currentColor" height="13" viewBox="0 0 24 24" width="13">
								<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
							</svg>
							Flash Sale
							{discount > 0 && <span className="ml-1 rounded-full bg-[#D94040] px-2 py-0.5 text-[11px] font-extrabold text-white">−{discount}%</span>}
						</div>
						<FlashSaleCountdown endsAt={flashSaleItem.ends_at} />
					</div>
				</div>
			)}

			{/* Price + Stock */}
			<div {...rise(200)}>
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
					{shownPrice != null ? (
						<AnimatedPeso className={cn('text-[28px] font-extrabold tracking-tight', flashSalePrice !== null ? 'text-[#C43131]' : 'text-[#432C63]')} value={shownPrice} />
					) : (
						<span className="text-[18px] font-semibold text-[#737373]">Price unavailable</span>
					)}
					{discount > 0 && (
						<>
							<span className="text-[17px] font-medium text-[#A39DAC] line-through">{peso(originalPrice as number)}</span>
							{flashSalePrice === null && <span className="rounded-full bg-[#432C63] px-2.5 py-1 text-[11.5px] font-bold leading-none text-white">−{discount}%</span>}
						</>
					)}
					<span className="mx-0.5 h-4 w-px bg-black/15" />
					<AnimatePresence initial={false} mode="wait">
						<m.span
							animate={{ opacity: 1, y: 0 }}
							className={cn('flex items-center gap-1.5 text-[13px] font-semibold', inStock ? (left != null && left <= FEW_LEFT ? 'text-[#B7791F]' : 'text-[#1F7A4D]') : 'text-[#C43131]')}
							data-testid="stock"
							exit={{ opacity: 0, y: -5 }}
							initial={{ opacity: 0, y: 5 }}
							key={inStock ? (left != null && left <= FEW_LEFT ? `left-${left}` : 'in') : 'out'}
							transition={{ duration: 0.2, ease: EASE_OUT }}
						>
							<span className={cn('h-2 w-2 rounded-full', inStock ? (left != null && left <= FEW_LEFT ? 'bg-[#E0A800]' : 'bg-[#2FA36B]') : 'bg-[#D94040]')} />
							{inStock ? (left != null && left > 0 && left <= FEW_LEFT ? `Only ${left} left` : 'In Stock') : 'Out of Stock'}
						</m.span>
					</AnimatePresence>
				</div>
			</div>

			{/* Description */}
			{descriptionHtml && (
				<div {...rise(250)}>
					<div
						className="text-[14px] leading-relaxed text-[#5B5B5B]"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: cleaned on the server by sanitizeSellerHtml
						dangerouslySetInnerHTML={{ __html: descriptionHtml }}
					/>
				</div>
			)}

			<div className="h-px w-full bg-black/[0.07]" />

			{/* Variants */}
			<div {...rise(300)}>
				<ProductVariants choice={choice} onPick={pick} product={product} />
			</div>

			{/* Quantity + Add to Cart + Wishlist */}
			<div {...rise(360)}>
				<div className="flex items-center gap-3">
					<div className="flex h-[52px] items-center rounded-full bg-[#F6F2FB]">
						<button aria-label="Decrease quantity" className="press flex h-[52px] w-11 items-center justify-center text-[18px] font-semibold text-[#432C63] disabled:opacity-30" disabled={quantity <= 1} onClick={() => setQuantity((n) => n - 1)} type="button">−</button>
						<span aria-live="polite" className="relative flex h-8 w-7 items-center justify-center overflow-hidden text-[15px] font-bold tabular-nums">
							<AnimatePresence initial={false} mode="popLayout">
								<m.span animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} initial={{ opacity: 0, y: 16 }} key={quantity} transition={{ duration: 0.22, ease: EASE_OUT }}>
									{quantity}
								</m.span>
							</AnimatePresence>
						</span>
						<button aria-label="Increase quantity" className="press flex h-[52px] w-11 items-center justify-center text-[18px] font-semibold text-[#432C63] disabled:opacity-30" disabled={quantity >= most} onClick={() => setQuantity((n) => n + 1)} type="button">+</button>
					</div>
					<MorphButton
						busy="Adding…"
						className="flex h-[52px] flex-1 items-center justify-center rounded-full bg-[#432C63] px-4 text-[14px] font-bold text-white shadow-[0_14px_30px_-10px_rgba(67,44,99,0.55)] hover:bg-[#372248] disabled:bg-[#DDD7E5] disabled:text-[#8A8493] disabled:shadow-none aria-busy:bg-[#6B5487] aria-busy:text-white"
						disabled={!canBuy}
						done="Added"
						idle={
							shopClosed ? 'Unavailable' : canBuy ? (
								<>Add to Cart <span aria-hidden="true" className="hidden font-medium text-white/70 sm:inline">· {peso((shownPrice ?? 0) * quantity)}</span></>
							) : 'Out of Stock'
						}
						onClick={handleAddToCart}
						state={state}
						type="button"
					/>
					<WishlistButton className="!h-[52px] !w-[52px] shrink-0 rounded-full !border-[#E3DDEA]" productId={product.id} user={user} wishlist={wishlist} />
					<ShareButton
						className="!h-[52px] !w-[52px] rounded-full !border-[#E3DDEA]"
						image={product.thumbnail ?? undefined}
						price={shownPrice != null ? peso(shownPrice) : undefined}
						title={product.title}
						variantParams={choice}
					/>
				</div>
			</div>

			{saleSoldOut && !saleEnded && !error && (
				<p className="text-sm text-secondary">
					The flash sale for this product has sold out. It's available at the regular price.
				</p>
			)}

			{shopClosed && (
				<p className="text-sm text-secondary">
					This shop isn't taking orders right now.
				</p>
			)}

			{error && (
				<ErrorMessage data-testid="add-to-cart-error" error={error} />
			)}
		</div>
	);
};
