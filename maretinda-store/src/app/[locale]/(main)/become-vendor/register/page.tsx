import { redirect } from 'next/navigation';

import { SELLER_REGISTER_URL } from '@/lib/helpers/cross-links';

/**
 * Paying for a plan before applying was retired (17 November 2026): every
 * seller applies in the seller panel and chooses a plan after approval.
 */
export default function BecomeVendorRegister() {
	redirect(SELLER_REGISTER_URL);
}
