'use client';

import { useParams, useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';

import type { MorphState } from '@/components/motion';
import { flyToCart, notify, notifyAdded } from '@/lib/cart-feedback';
import { addToCart } from '@/lib/data/cart';
import type { ProductCardData } from '@/types/search';

/** Adds a product straight from its card, when there is nothing to choose. */
export function useQuickAdd(product: ProductCardData, signedIn: boolean) {
	const router = useRouter();
	const { locale } = useParams<{ locale: string }>();
	const [state, setState] = useState<MorphState>('idle');
	const [, startTransition] = useTransition();
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

	/** A flash sale price is claimed on the product page, where its countdown and limit are. */
	const canQuickAdd = product.in_stock && product.variant_count === 1 && !!product.variant_id && !product.flash_sale;

	const add = (picture: Element | null | undefined, src: string | null | undefined) => {
		if (state === 'busy') return;
		if (!signedIn) {
			router.push(`/user?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
			return;
		}
		setState('busy');
		// The picture leaves at once; the answer is usually back before it lands
		const landed = flyToCart(picture, src);
		startTransition(async () => {
			const result = await addToCart({ countryCode: locale, quantity: 1, variantId: product.variant_id as string });
			await landed;
			if (result.error) {
				setState('idle');
				notify({ title: result.error, tone: 'error' });
				return;
			}
			setState('done');
			notifyAdded(product.title);
			clearTimeout(timer.current);
			timer.current = setTimeout(() => setState('idle'), 1600);
		});
	};

	return { add, canQuickAdd, state };
}
