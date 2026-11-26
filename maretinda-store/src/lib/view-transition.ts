'use client';

import { prefersReducedMotion } from '@/components/motion/tokens';

/**
 * Opening a product makes the card's picture grow into the product page's.
 * The page that is loading shows that same picture at once (see
 * products/[handle]/loading.tsx), so there is something to grow into. Browsers
 * without view transitions simply open the page.
 */
export type OpeningProduct = {
	id: string;
	handle: string;
	title: string;
	thumbnail: string | null;
	price?: number | null;
	original_price?: number | null;
};

let opening: OpeningProduct | null = null;
let arrived: (() => void) | null = null;

/** The product being opened, for the loading page to show straight away. */
export const openingProduct = (handle?: string) => (opening && (!handle || opening.handle === handle) ? opening : null);

/** Called by the product page's picture once it is on screen. */
export const productPictureReady = () => {
	arrived?.();
	arrived = null;
};

/** Long enough for a normal connection; after that, just open the page. */
const PATIENCE_MS = 700;

type WithViewTransition = Document & {
	startViewTransition?: (update: () => Promise<void>) => { finished: Promise<void>; ready: Promise<void> };
};

export function openProduct(product: OpeningProduct, picture: HTMLElement | null, navigate: () => void) {
	opening = product;
	const doc = document as WithViewTransition;
	if (!doc.startViewTransition || !picture || prefersReducedMotion()) {
		navigate();
		return;
	}
	picture.style.viewTransitionName = 'product-hero';
	const transition = doc.startViewTransition(() => {
		// The name has been noted; two elements may not share it once the page opens
		picture.style.viewTransitionName = '';
		return new Promise<void>((resolve) => {
			arrived = resolve;
			setTimeout(resolve, PATIENCE_MS);
			navigate();
		});
	});
	// An interrupted transition rejects these; the page opens all the same
	transition.ready.catch(() => {});
	transition.finished.catch(() => {}).finally(() => {
		picture.style.viewTransitionName = '';
	});
}

/** Left, plain clicks only: new tabs, modified clicks and middle clicks stay the browser's. */
export const isPlainClick = (e: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; defaultPrevented: boolean }) =>
	e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.defaultPrevented;
