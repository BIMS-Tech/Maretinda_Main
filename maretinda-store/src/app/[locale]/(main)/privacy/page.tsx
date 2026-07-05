import type { Metadata } from 'next';

import { LegalPage } from '@/components/sections/Legal/LegalPage';
import { privacyDocs } from '@/components/sections/Legal/privacyData';

export const metadata: Metadata = {
	title: 'Privacy Policy',
	description:
		'How Maretinda (BIMS Technologies Inc.) collects, uses, stores, and protects the personal information of buyers and sellers, in compliance with the Philippine Data Privacy Act of 2012.',
};

export default function PrivacyPage() {
	return (
		<LegalPage
			eyebrow="Privacy"
			heading="Privacy Policy"
			tagline="How we collect, use, and protect your personal information, in compliance with the Philippine Data Privacy Act of 2012 (R.A. 10173)."
			docs={privacyDocs}
		/>
	);
}
