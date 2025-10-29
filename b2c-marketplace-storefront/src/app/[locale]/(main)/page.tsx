import type { Metadata } from 'next';

import {
	// AlgoliaTrendingListings,
	// BannerSection,
	BlogSection,
	FeaturedProductsSection,
	Hero,
	HomeCategories,
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
		<main className="max-w-7xl w-full mx-auto flex flex-col row-start-2 items-center sm:items-start text-primary">
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
				heading="Find clothes that matches your style"
				paragraph="Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book."
			/>

			{/* Trending Products */}
			<div className="container w-full">
				{/* <HomeProductSection
					heading="Trending Products"
					home
					locale={locale}
				/> */}
				<TrendingProducts locale={locale} />
			</div>

			{/* Quick Category Access */}
			<div className="container w-full mb-5">
				<HomeCategories heading="Categories" />
			</div>

			{/* Featured Products Section */}
			<div className="container w-full">
				<FeaturedProductsSection />
			</div>

			{/* Special Offer Section */}
			<div className="container w-full">
				<SpecialOffer />
			</div>

			{/* Shop by Style */}
			<ShopByStyleSection />

			{/* Blog Section */}
			<div className="mb-10">
				<BlogSection />
			</div>

			{/* Category-Specific Sections */}
			{/* <div className="px-4 lg:px-8 w-full">
				<section className="py-8">
					<h2 className="heading-lg text-primary uppercase mb-8">
						Fresh Groceries
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="bg-green-50 p-6 rounded-lg border border-green-200">
							<div className="flex items-center mb-4">
								<span className="text-3xl mr-3">🍎</span>
								<h3 className="text-xl font-bold text-green-800">
									Fresh Produce
								</h3>
							</div>
							<p className="text-green-700">
								Farm-fresh fruits and vegetables delivered daily
							</p>
							<a
								className="text-green-600 font-medium mt-2 inline-block hover:underline"
								href="/categories/groceries/fresh-produce"
							>
								Shop Now →
							</a>
						</div>
						<div className="bg-green-50 p-6 rounded-lg border border-green-200">
							<div className="flex items-center mb-4">
								<span className="text-3xl mr-3">🥛</span>
								<h3 className="text-xl font-bold text-green-800">
									Dairy & Eggs
								</h3>
							</div>
							<p className="text-green-700">
								Fresh dairy products from local farms
							</p>
							<a
								className="text-green-600 font-medium mt-2 inline-block hover:underline"
								href="/categories/groceries/dairy-eggs"
							>
								Shop Now →
							</a>
						</div>
						<div className="bg-green-50 p-6 rounded-lg border border-green-200">
							<div className="flex items-center mb-4">
								<span className="text-3xl mr-3">🥗</span>
								<h3 className="text-xl font-bold text-green-800">
									Organic Foods
								</h3>
							</div>
							<p className="text-green-700">
								Certified organic and health-conscious options
							</p>
							<a
								className="text-green-600 font-medium mt-2 inline-block hover:underline"
								href="/categories/groceries/organic-health"
							>
								Shop Now →
							</a>
						</div>
					</div>
				</section>
			</div>

			<div className="px-4 lg:px-8 w-full">
				<section className="py-8">
					<h2 className="heading-lg text-primary uppercase mb-8">
						Delicious Food
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
							<div className="flex items-center mb-4">
								<span className="text-3xl mr-3">🍱</span>
								<h3 className="text-xl font-bold text-orange-800">
									Ready Meals
								</h3>
							</div>
							<p className="text-orange-700">
								Quick and delicious ready-to-eat options
							</p>
							<a
								className="text-orange-600 font-medium mt-2 inline-block hover:underline"
								href="/categories/food/ready-meals"
							>
								Order Now →
							</a>
						</div>
						<div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
							<div className="flex items-center mb-4">
								<span className="text-3xl mr-3">🌍</span>
								<h3 className="text-xl font-bold text-orange-800">
									International
								</h3>
							</div>
							<p className="text-orange-700">
								Authentic flavors from around the world
							</p>
							<a
								className="text-orange-600 font-medium mt-2 inline-block hover:underline"
								href="/categories/food/international"
							>
								Explore →
							</a>
						</div>
						<div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
							<div className="flex items-center mb-4">
								<span className="text-3xl mr-3">🇵🇭</span>
								<h3 className="text-xl font-bold text-orange-800">
									Local Delicacies
								</h3>
							</div>
							<p className="text-orange-700">
								Traditional Filipino favorites and specialties
							</p>
							<a
								className="text-orange-600 font-medium mt-2 inline-block hover:underline"
								href="/categories/food/local-delicacies"
							>
								Taste →
							</a>
						</div>
					</div>
				</section>
			</div> */}

			{/* Featured Banner Section */}
			{/* <BannerSection /> */}

			{/* <AlgoliaTrendingListings /> */}

			{/* Popular Brands */}
			{/* <HomePopularBrandsSection /> */}
		</main>
	);
}
