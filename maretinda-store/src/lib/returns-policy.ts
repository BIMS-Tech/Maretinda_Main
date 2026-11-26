/**
 * The return reasons and refund accounts the policy allows (same codes as the
 * backend's lib/refund-policy). Change of mind is deliberately not a reason.
 */
export const RETURN_REASONS = [
	{ code: 'damaged-defective', label: 'Damaged or defective', hint: 'Broken, not working, or a hidden defect', sendBack: true, video: true },
	{ code: 'wrong-item', label: 'Wrong item delivered', hint: 'A different product, size, colour or variation', sendBack: true, video: false },
	{ code: 'incomplete', label: 'Incomplete order', hint: 'Parts, accessories or items are missing', sendBack: true, video: true },
	{ code: 'not-as-described', label: 'Not as described, or counterfeit', hint: 'Materially different from the listing', sendBack: true, video: false },
	{ code: 'expired', label: 'Expired goods', hint: 'Food or consumables past their expiry date', sendBack: true, video: false },
	{ code: 'not-received', label: 'Not received, or lost in transit', hint: 'The parcel never arrived', sendBack: false, video: false },
] as const;

export type ReasonCode = (typeof RETURN_REASONS)[number]['code'];

export const reasonOf = (code: string) => RETURN_REASONS.find((r) => r.code === code);

export type Payout = {
	account_name: string;
	account_number: string;
	bank_name?: string;
	method: 'gcash' | 'maya' | 'bank' | '';
};

export const EMPTY_PAYOUT: Payout = { account_name: '', account_number: '', bank_name: '', method: '' };

export const peso = (n: number | string | null | undefined) =>
	new Intl.NumberFormat('en-PH', { currency: 'PHP', style: 'currency' }).format(Number(n) || 0);

export const longDate = (d: string | null | undefined) =>
	d ? new Date(d).toLocaleString('en-PH', { day: 'numeric', hour: 'numeric', minute: '2-digit', month: 'long', timeZone: 'Asia/Manila' }) : '';

export const shortDate = (d: string | null | undefined) =>
	d ? new Date(d).toLocaleDateString('en-PH', { day: 'numeric', month: 'long', timeZone: 'Asia/Manila', year: 'numeric' }) : '';
