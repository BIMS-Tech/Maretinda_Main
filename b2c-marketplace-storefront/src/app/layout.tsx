import type { Metadata } from 'next';
import { Inter, Lora } from 'next/font/google';
import './globals.css';

import { Toaster } from '@medusajs/ui';

const funnelDisplay = Inter({
	subsets: ['latin'],
	variable: '--font-funnel-sans',
	weight: ['300', '400', '500', '600'],
});

const lora = Lora({
	subsets: ['latin'],
	variable: '--font-lora',
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

export default async function RootLayout({
	children,
	params,
}: Readonly<{
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}>) {
	const { locale } = await params;

	return (
		<html className="" lang={locale}>
			<body
				className={`${funnelDisplay.className} ${lora.variable} antialiased bg-primary text-secondary relative`}
			>
				{children}
				<Toaster position="top-right" />
			</body>
		</html>
	);
}
