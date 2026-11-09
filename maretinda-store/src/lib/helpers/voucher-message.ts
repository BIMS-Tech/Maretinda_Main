const pesos = (amount: number) => `₱${Math.ceil(amount).toLocaleString('en-PH')}`;

/** Buyer-facing reason for a voucher the backend refused outright. */
export const voucherErrorMessage = (raw: string | undefined, code: string): string => {
	if (!raw) return `We couldn't apply ${code}. Please try again.`;
	// Medusa's wording for a code that doesn't exist
	if (/promotion code .* is invalid/i.test(raw)) return `${code} isn't a valid voucher code`;
	// Mercur 1.5's wording for an unknown code, or a seller's code without that seller's items
	if (/some of the promotion codes are invalid/i.test(raw)) return `${code} isn't a valid voucher code for this cart`;
	return raw;
};

/**
 * Medusa accepts the request but leaves out a voucher whose conditions aren't
 * met, without saying why. Explain what we can from the voucher list.
 */
export const voucherNotAppliedMessage = (
	code: string,
	subtotal: number,
	voucher?: { min_order?: number; expires_at?: string | null },
	now = new Date(),
): string => {
	if (voucher?.expires_at && new Date(voucher.expires_at) < now) return `${code} has expired`;
	if (voucher?.min_order && subtotal < voucher.min_order) {
		return `Spend ${pesos(voucher.min_order - subtotal)} more to use ${code} (min. spend ${pesos(voucher.min_order)})`;
	}
	return `${code} can't be used on this order. It may have run out or not cover these items.`;
};
