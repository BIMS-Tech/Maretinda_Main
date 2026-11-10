type SellerAddress = {
	address_line?: string | null;
	city?: string | null;
	state?: string | null;
	postal_code?: string | null;
	country_code?: string | null;
	email?: string | null;
	phone?: string | null;
};

const join = (separator: string, ...parts: (string | null | undefined)[]) =>
	parts.filter((part) => part?.trim()).join(separator);

/**
 * The seller's return address as display lines. Most sellers type the whole
 * address into address_line and leave the rest empty, so empty parts are
 * dropped rather than shown as ", , ,".
 */
export const sellerAddressLines = (seller?: SellerAddress | null): string[] =>
	seller
		? [
				join('', seller.address_line),
				join(', ', seller.city, seller.state),
				join(
					' ',
					seller.postal_code,
					seller.country_code?.toUpperCase(),
				),
				join(' · ', seller.email, seller.phone),
			].filter(Boolean)
		: [];
