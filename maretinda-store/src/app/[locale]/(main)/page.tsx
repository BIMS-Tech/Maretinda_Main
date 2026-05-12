import type { Metadata } from 'next';

import {
	BlogSection,
	FeaturedProductsSection,
	FlashSaleSection,
	Hero,
	HomeCategories,
	HomeCollections,
	ShopByStyleSection,
	SpecialOffer,
	TrendingProducts,
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
			{/* Hero — purple gradient with main card, promo sidebar, service strip */}
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

			{/* Shop by Category — 10-tile grid */}
			<HomeCategories heading="Shop by category" />

			{/* Flash Sale — live countdown + product cards */}
			<FlashSaleSection locale={locale} />

			{/* Trending Products */}
			<div className="max-w-[1360px] w-full mx-auto px-4 lg:px-6 py-10 lg:py-12">
				<TrendingProducts locale={locale} />
			</div>

			{/* Collections */}
			<div className="max-w-[1360px] w-full mx-auto px-4 lg:px-6 pb-10">
				<h2 className="text-[28px] font-extrabold tracking-tight text-[#1B1B1B] mb-6">Collections</h2>
				<HomeCollections />
			</div>

			{/* Featured Products */}
			<div className="max-w-[1360px] w-full mx-auto px-4 lg:px-6 pb-10">
				<FeaturedProductsSection />
			</div>

			{/* Special Offer */}
			<div className="max-w-[1360px] w-full mx-auto px-4 lg:px-6 pb-10">
				<SpecialOffer />
			</div>

			{/* Shop by Style */}
			<ShopByStyleSection />

			{/* Blog */}
			<div className="mb-10">
				<BlogSection />
			</div>
		</main>
	);
}
