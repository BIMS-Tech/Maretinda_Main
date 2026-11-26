import type { Metadata } from 'next';

import {
	BecomeSellerBand,
	FeaturedCollectionsSection,
	FlashSaleSection,
	Hero,
	HomeCategories,
	NewsletterSection,
	TopsellersSection,
	TrendingNowSection,
	TrustSection,
} from '@/components/sections';
import CampaignBanners from '@/components/sections/CampaignBanners/CampaignBanners';
import { ReelsSection } from '@/components/sections/ReelsSection/ReelsSection';
import { getHeroContent } from '@/lib/data/hero';

export const metadata: Metadata = {
	description:
		'Welcome to Maretinda! From fresh groceries to latest fashion - discover everything you need from trusted local sellers in the Philippines.',
	openGraph: {
		description:
			'From fresh groceries to latest fashion - discover everything you need from trusted local sellers. Multi-category marketplace for the Philippines.',
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

import { SELLER_PANEL_URL } from '@/lib/helpers/cross-links';

export default async function Home() {
	const heroContent = await getHeroContent();

	return (
		<main className="w-full flex flex-col">
			{/* 1. Hero — purple gradient, main card, promo sidebar, service strip */}
			<Hero
				buttons={[
					{ label: 'Start Shopping', path: '/categories' },
					{
						label: 'Become a Seller',
						// The seller panel this storefront links to (test or production), not a guess from the old search keys
						path: `${SELLER_PANEL_URL}/login`,
					},
				]}
				heroContent={heroContent}
			/>

			{/* 2. Shop by Category — 10-tile grid */}
			<HomeCategories heading="Shop by category" />

			{/* 3. Campaigns — active sale events */}
			<CampaignBanners />

			{/* 4. Flash Sale — live countdown + product cards */}
			<FlashSaleSection />

			{/* 4. Trending Now — 6-card product grid with filter pills */}
			<TrendingNowSection />

			{/* 5. Reels — seller videos; renders nothing until sellers post */}
			<div className="max-w-[1360px] w-full mx-auto px-4 lg:px-6">
				<ReelsSection
					heading="Reels"
					limit={10}
					showSeller
					subheading="Watch products in action from sellers you love"
					viewAllHref="/reels"
				/>
			</div>

			{/* 6. Featured Collections — editorial 12-col grid */}
			<FeaturedCollectionsSection />

			{/* 6. Top sellers — 4-card seller grid */}
			<TopsellersSection />

			{/* 7. Become a Seller CTA band */}
			<BecomeSellerBand />

			{/* 8. Trust pillars — buyer protection / delivery / payments */}
			<TrustSection />

			{/* 9. Newsletter — email subscription band */}
			<NewsletterSection />
		</main>
	);
}
