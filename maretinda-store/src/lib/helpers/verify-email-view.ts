export type VerifyEmailView =
	| 'ready'
	| 'sign-in'
	| 'other-account'
	| 'seller'
	| 'failed';

/**
 * What the confirmation page offers once the link has been used. The link
 * often opens in a different browser or phone from the one the buyer signed
 * up on, so it can't assume this browser is signed in to that account. The
 * link confirms the address; it doesn't sign anyone in.
 */
export function verifyEmailView(
	result: {
		email?: string;
		kind?: 'customer' | 'seller_application';
		ok: boolean;
	},
	viewer: string | null,
): VerifyEmailView {
	if (!result.ok) return 'failed';
	if (result.kind === 'seller_application') return 'seller';
	if (!viewer) return 'sign-in';
	return viewer.trim().toLowerCase() === result.email?.trim().toLowerCase()
		? 'ready'
		: 'other-account';
}
