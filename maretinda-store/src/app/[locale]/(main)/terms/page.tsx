import type { Metadata } from 'next';

import { LegalPage } from '@/components/sections/Legal/LegalPage';
import { termsDocs } from '@/components/sections/Legal/termsData';

export const metadata: Metadata = {
	title: 'Terms & Conditions',
	description:
		'Maretinda Terms of Service for buyers and the Seller / Merchant Agreement, governing your use of the marketplace operated by BIMS Technologies Inc.',
};

export default function TermsPage() {
	return (
		<LegalPage
			eyebrow="Legal"
			heading="Terms & Conditions"
			tagline="The agreements that govern your use of the Maretinda marketplace, operated by BIMS Technologies Inc."
			docs={termsDocs}
		/>
	);
}
