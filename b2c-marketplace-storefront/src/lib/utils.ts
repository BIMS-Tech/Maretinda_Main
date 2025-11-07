import type { HttpTypes } from '@medusajs/types';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function sortCategories(
	a: HttpTypes.StoreProductCategory,
	b: HttpTypes.StoreProductCategory,
) {
	if (!a?.rank) return -1;
	if (!b?.rank) return 1;

	if (a.rank < b.rank) {
		return -1;
	}
	if (a.rank > b.rank) {
		return 1;
	}
	return 0;
}
