import type { HttpTypes } from '@medusajs/types';

import { variantInStock } from './helpers/product-card';

/** A variant's choices by option name, e.g. { size: "XL" }. */
export type Choice = Record<string, string>;

export const choiceOf = (variant: Pick<HttpTypes.StoreProductVariant, 'options'> | null | undefined): Choice =>
	Object.fromEntries((variant?.options ?? []).map((o) => [(o.option?.title ?? '').toLowerCase(), o.value ?? '']));

/**
 * The variant with exactly these choices. Compared whole: matching parts of
 * them took "L" for "XL", and put the wrong size in the cart.
 */
export const variantFor = <V extends Pick<HttpTypes.StoreProductVariant, 'options'>>(variants: V[] | null | undefined, choice: Choice): V | undefined =>
	(variants ?? []).find((v) => (v.options ?? []).every((o) => choice[(o.option?.title ?? '').toLowerCase()] === o.value));

export type Availability = 'available' | 'sold_out' | 'none';

/** Whether a value can be had with the other choices as they are. */
export function valueAvailability(variants: HttpTypes.StoreProductVariant[] | null | undefined, choice: Choice, option: string, value: string): Availability {
	const variant = variantFor(variants, { ...choice, [option]: value });
	if (!variant) return 'none';
	return variantInStock(variant) && variant.calculated_price?.calculated_amount != null ? 'available' : 'sold_out';
}

/**
 * The choices after picking a value. If nothing is sold in that exact
 * combination, the other choices move to one that is.
 */
export function pickValue(variants: HttpTypes.StoreProductVariant[] | null | undefined, choice: Choice, option: string, value: string): Choice {
	const wanted = { ...choice, [option]: value };
	if (variantFor(variants, wanted)) return wanted;
	const withValue = (variants ?? []).filter((v) => choiceOf(v)[option] === value);
	if (!withValue.length) return wanted;
	const sameAs = (v: HttpTypes.StoreProductVariant) => Object.entries(choiceOf(v)).filter(([k, x]) => wanted[k] === x).length;
	const best = [...withValue].sort((a, b) => Number(variantInStock(b)) - Number(variantInStock(a)) || sameAs(b) - sameAs(a))[0];
	return { ...wanted, ...choiceOf(best) };
}

/**
 * The choices a product opens with: the cheapest variant that can be bought,
 * among those the address asks for if it names any that exist.
 */
export function openingChoice(variants: HttpTypes.StoreProductVariant[] | null | undefined, fromAddress: Choice): Choice {
	const price = (v: HttpTypes.StoreProductVariant) => Number(v.calculated_price?.calculated_amount ?? Number.MAX_SAFE_INTEGER);
	const list = [...(variants ?? [])].sort((a, b) => Number(variantInStock(b)) - Number(variantInStock(a)) || price(a) - price(b));
	const asked = Object.entries(fromAddress);
	const names = new Set(list.flatMap((v) => Object.keys(choiceOf(v))));
	const wanted = asked.filter(([name]) => names.has(name));
	return choiceOf(list.find((v) => wanted.every(([name, value]) => choiceOf(v)[name] === value)) ?? list[0]);
}
