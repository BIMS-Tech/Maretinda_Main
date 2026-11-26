'use client';

import { useSyncExternalStore } from 'react';

import { prefersReducedMotion } from '@/components/motion/tokens';

/**
 * What the shopper sees when something goes into their cart: its picture flies
 * to the cart icon, the count catches it, and a note offers to open the cart.
 */

type Note = { id: number; title: string; action?: { label: string; onClick: () => void }; tone?: 'success' | 'error' };
type State = { drawerOpen: boolean; notes: Note[] };

let state: State = { drawerOpen: false, notes: [] };
const listeners = new Set<() => void>();
const set = (next: Partial<State>) => {
	state = { ...state, ...next };
	for (const listener of listeners) listener();
};
const subscribe = (listener: () => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};
const SERVER_STATE: State = { drawerOpen: false, notes: [] };

export const useCartFeedback = () => useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);

export const openCartDrawer = () => set({ drawerOpen: true, notes: [] });
export const closeCartDrawer = () => set({ drawerOpen: false });

let nextId = 0;
const timers = new Map<number, ReturnType<typeof setTimeout>>();

export const dismissNote = (id: number) => {
	clearTimeout(timers.get(id));
	timers.delete(id);
	set({ notes: state.notes.filter((n) => n.id !== id) });
};

export function notify(note: Omit<Note, 'id'>, forMs = 4200) {
	const id = ++nextId;
	// One at a time: a newer note takes the older one's place
	set({ notes: [{ ...note, id }] });
	timers.set(id, setTimeout(() => dismissNote(id), forMs));
}

export const notifyAdded = (title: string) =>
	notify({ action: { label: 'View cart', onClick: openCartDrawer }, title: `${title} added to your cart`, tone: 'success' });

/** The cart icon that is on screen now: the header has one for phones and one for desktops. */
const cartIcon = () =>
	[...document.querySelectorAll<HTMLElement>('[data-cart-target]')].find((el) => {
		const box = el.getBoundingClientRect();
		return box.width > 0 && box.bottom > -200;
	});

/** Sends a picture to the cart icon. Resolves when it lands. */
export async function flyToCart(picture: Element | null | undefined, src: string | null | undefined) {
	const target = cartIcon();
	if (!target || !picture || !src || prefersReducedMotion() || !('animate' in picture)) return;

	const from = picture.getBoundingClientRect();
	const to = target.getBoundingClientRect();
	if (!from.width || from.bottom < 0 || from.top > window.innerHeight) return;

	const size = Math.min(from.width, from.height, 260);
	const start = { x: from.left + (from.width - size) / 2, y: from.top + (from.height - size) / 2 };
	// The header may be scrolled away: aim for where it would be
	const end = { x: to.left + to.width / 2 - size / 2, y: Math.max(12, to.top + to.height / 2) - size / 2 };
	const dx = end.x - start.x;
	const dy = end.y - start.y;

	const img = document.createElement('img');
	img.src = src;
	img.alt = '';
	img.setAttribute('aria-hidden', 'true');
	Object.assign(img.style, {
		borderRadius: '18px',
		filter: 'drop-shadow(0 18px 24px rgba(42,27,62,.28))',
		height: `${size}px`,
		left: `${start.x}px`,
		objectFit: 'contain',
		pointerEvents: 'none',
		position: 'fixed',
		top: `${start.y}px`,
		width: `${size}px`,
		willChange: 'transform, opacity',
		zIndex: '200',
	});
	document.body.appendChild(img);

	// Lifts off, then curves in
	const flight = img.animate(
		[
			{ opacity: 1, transform: 'translate(0, 0) scale(1)' },
			{ offset: 0.22, opacity: 1, transform: `translate(${dx * 0.04}px, ${Math.min(-18, dy * 0.06)}px) scale(.62)` },
			{ offset: 0.7, opacity: 1, transform: `translate(${dx * 0.72}px, ${dy * 0.86 - 14}px) scale(.26)` },
			{ opacity: 0.2, transform: `translate(${dx}px, ${dy}px) scale(.07)` },
		],
		{ duration: 820, easing: 'cubic-bezier(.45, 0, .2, 1)' },
	);
	await flight.finished.catch(() => {});
	img.remove();
	catchInCart();
}

/** The cart icon's little catch. */
export function catchInCart() {
	const target = cartIcon();
	if (!target || prefersReducedMotion()) return;
	target.classList.remove('cart-catch');
	// Restarts the animation if it is already running
	void target.offsetWidth;
	target.classList.add('cart-catch');
	target.addEventListener('animationend', () => target.classList.remove('cart-catch'), { once: true });
}
