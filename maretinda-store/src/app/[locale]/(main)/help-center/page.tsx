import type { Metadata } from 'next';

import { HelpCenter } from '@/components/sections/HelpCenter/HelpCenter';

export const metadata: Metadata = {
	title: 'Help Center',
	description: 'Find answers to your questions about orders, shipping, returns, payments, and more.',
};

export default function HelpCenterPage() {
	return <HelpCenter />;
}
