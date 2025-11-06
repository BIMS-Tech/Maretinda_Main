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
	if (!a) return -1;
	if (!b) return 1;

	if (a.name < b.name) {
		return -1;
	}
	if (a.name > b.name) {
		return 1;
	}
	return 0;
}
