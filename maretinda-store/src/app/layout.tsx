import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '../fonts/fonts.css';
import './globals.css';
import './motion.css';

import { Toaster } from '@medusajs/ui';

import { MotionProvider, Notes } from '@/components/motion';
import { CookieConsent } from '@/components/organisms/CookieConsent/CookieConsent';
import { LanguageProvider } from '@/providers/LanguageProvider';

export const metadata: Metadata = {
	description:
		process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
		'Maretinda - From fresh groceries to latest fashion, discover everything you need from trusted local sellers',
	metadataBase: new URL(
		process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
	),
	title: {
		default:
			process.env.NEXT_PUBLIC_SITE_NAME ||
			'Maretinda - Your Complete Marketplace',
		template: `%s | ${
			process.env.NEXT_PUBLIC_SITE_NAME ||
			'Maretinda - Your Complete Marketplace'
		}`,
	},
};

export default function RootLayout({
	children,
}: {
	readonly children: ReactNode;
}) {
	const defaultLocale = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'en';

	return (
		<html className="" lang={defaultLocale}>
			<body
				className="antialiased bg-primary text-secondary relative"
			>
				<MotionProvider>
					<LanguageProvider>
						{children}
						<Notes />
					</LanguageProvider>
				</MotionProvider>
				<Toaster position="top-right" />
				<CookieConsent />
			</body>
		</html>
	);
}
