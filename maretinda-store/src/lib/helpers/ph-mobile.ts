/**
 * Same rule as backend/src/lib/ph-mobile.ts: the couriers only accept PH mobiles
 * as +639XXXXXXXXX. Buyers usually type 09XX, so convert the common spellings
 * and return null for anything that is not a PH mobile.
 */
export const toPhMobile = (phone?: string | null): string | null => {
	const digits = String(phone ?? '').replace(/[^\d]/g, '');
	const local = digits.startsWith('63')
		? digits.slice(2)
		: digits.startsWith('0')
			? digits.slice(1)
			: digits;
	return /^9\d{9}$/.test(local) ? `+63${local}` : null;
};

/** The part after +63, for a field that already shows the prefix. */
export const phMobileLocalPart = (phone?: string | null): string => {
	const mobile = toPhMobile(phone);
	return mobile ? mobile.slice(3) : phone || '';
};
