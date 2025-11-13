import type { Metadata } from 'next';
import { Inter, Lora, Poppins } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

import { Toaster } from '@medusajs/ui';

const funnelDisplay = Inter({
	subsets: ['latin'],
	variable: '--font-funnel-sans',
	weight: ['300', '400', '500', '600', '700'],
});

const lora = Lora({
	subsets: ['latin'],
	variable: '--font-lora',
	weight: ['400', '500', '600', '700'],
});

const poppins = Poppins({
	subsets: ['latin'],
	variable: '--font-poppins',
	weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
	description:
		process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
		'Maretinda - From fresh groceries to latest fashion, discover everything you need from trusted local vendors',
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
				className={`${funnelDisplay.className} ${lora.variable} ${poppins.variable} antialiased bg-primary text-secondary relative`}
			>
				{children}
				<Toaster position="top-right" />
			</body>
		</html>
	);
}
