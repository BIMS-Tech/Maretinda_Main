import type { Metadata } from 'next';

import {
	BecomeSellerBand,
	FeaturedCollectionsSection,
	FlashSaleSection,
	Hero,
	HomeCategories,
	NewsletterSection,
	TopVendorsSection,
	TrendingNowSection,
	TrustSection,
} from '@/components/sections';

export const metadata: Metadata = {
	description:
		'Welcome to Maretinda! From fresh groceries to latest fashion - discover everything you need from trusted local vendors in the Philippines.',
	openGraph: {
		description:
			'From fresh groceries to latest fashion - discover everything you need from trusted local vendors. Multi-category marketplace for the Philippines.',
		images: [
			{
				alt: 'Maretinda - Your Complete Marketplace',
				height: 630,
				url: '/B2C_Storefront_Open_Graph.png',
				width: 1200,
			},
		],
		siteName: 'Maretinda',
		title: 'Maretinda - Your Complete Marketplace',
		type: 'website',
		url: process.env.NEXT_PUBLIC_BASE_URL,
	},
	title: 'Home',
};

export default async function Home({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;

	return (
		<main className="w-full flex flex-col">
			{/* 1. Hero — purple gradient, main card, promo sidebar, service strip */}
			<Hero
				buttons={[
					{ label: 'Start Shopping', path: '/categories' },
					{
						label: 'Become a Seller',
						path:
							process.env.NEXT_PUBLIC_ALGOLIA_ID === 'UO3C5Y8NHX'
								? 'https://vendor-sandbox.vercel.app/'
								: 'https://vendor.mercurjs.com',
					},
				]}
				heading="Shop the Philippines. All in one place."
				paragraph="From fresh palengke produce to fashion-forward finds — discover thousands of trusted local vendors, with fast nationwide delivery and cash on delivery available."
			/>

			{/* 2. Shop by Category — 10-tile grid */}
			<HomeCategories heading="Shop by category" />

			{/* 3. Flash Sale — live countdown + product cards */}
			<FlashSaleSection locale={locale} />

			{/* 4. Trending Now — 6-card product grid with filter pills */}
			<TrendingNowSection locale={locale} />

			{/* 5. Featured Collections — editorial 12-col grid */}
			<FeaturedCollectionsSection />

			{/* 6. Top Vendors — 4-card vendor grid */}
			<TopVendorsSection />

			{/* 7. Become a Seller CTA band */}
			<BecomeSellerBand />

			{/* 8. Trust pillars — buyer protection / delivery / payments */}
			<TrustSection />

			{/* 9. Newsletter — email subscription band */}
			<NewsletterSection />
		</main>
	);
}
