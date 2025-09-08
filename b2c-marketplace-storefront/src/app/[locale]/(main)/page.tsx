import {
  AlgoliaTrendingListings,
  BannerSection,
  BlogSection,
  Hero,
  HomeCategories,
  HomePopularBrandsSection,
  HomeProductSection,
  ShopByStyleSection,
} from "@/components/sections"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Home",
  description:
    "Welcome to Maretinda! From fresh groceries to latest fashion - discover everything you need from trusted local vendors in the Philippines.",
  openGraph: {
    title: "Maretinda - Your Complete Marketplace",
    description:
      "From fresh groceries to latest fashion - discover everything you need from trusted local vendors. Multi-category marketplace for the Philippines.",
    url: process.env.NEXT_PUBLIC_BASE_URL,
    siteName: "Maretinda",
    type: "website",
    images: [
      {
        url: "/B2C_Storefront_Open_Graph.png",
        width: 1200,
        height: 630,
        alt: "Maretinda - Your Complete Marketplace",
      },
    ],
  },
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start text-primary">
      <Hero
        heading="Welcome to Maretinda"
        paragraph="From fresh groceries to the latest fashion - discover everything you need from trusted local vendors across the Philippines."
        buttons={[
          { label: "Start Shopping", path: "/categories" },
          {
            label: "Become a Seller",
            path:
              process.env.NEXT_PUBLIC_ALGOLIA_ID === "UO3C5Y8NHX"
                ? "https://vendor-sandbox.vercel.app/"
                : "https://vendor.mercurjs.com",
          },
        ]}
      />
      
      {/* Quick Category Access */}
      <div className="px-4 lg:px-8 w-full">
        <HomeCategories heading="EXPLORE ALL CATEGORIES" />
      </div>
      
      {/* Trending Products */}
      <div className="px-4 lg:px-8 w-full">
        <HomeProductSection heading="Trending Now" locale={locale} home />
      </div>
      
      {/* Category-Specific Sections */}
      <div className="px-4 lg:px-8 w-full">
        <section className="py-8">
          <h2 className="heading-lg text-primary uppercase mb-8">Fresh Groceries</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">🍎</span>
                <h3 className="text-xl font-bold text-green-800">Fresh Produce</h3>
              </div>
              <p className="text-green-700">Farm-fresh fruits and vegetables delivered daily</p>
              <a href="/categories/groceries/fresh-produce" className="text-green-600 font-medium mt-2 inline-block hover:underline">Shop Now →</a>
            </div>
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">🥛</span>
                <h3 className="text-xl font-bold text-green-800">Dairy & Eggs</h3>
              </div>
              <p className="text-green-700">Fresh dairy products from local farms</p>
              <a href="/categories/groceries/dairy-eggs" className="text-green-600 font-medium mt-2 inline-block hover:underline">Shop Now →</a>
            </div>
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">🥗</span>
                <h3 className="text-xl font-bold text-green-800">Organic Foods</h3>
              </div>
              <p className="text-green-700">Certified organic and health-conscious options</p>
              <a href="/categories/groceries/organic-health" className="text-green-600 font-medium mt-2 inline-block hover:underline">Shop Now →</a>
            </div>
          </div>
        </section>
      </div>

      <div className="px-4 lg:px-8 w-full">
        <section className="py-8">
          <h2 className="heading-lg text-primary uppercase mb-8">Delicious Food</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">🍱</span>
                <h3 className="text-xl font-bold text-orange-800">Ready Meals</h3>
              </div>
              <p className="text-orange-700">Quick and delicious ready-to-eat options</p>
              <a href="/categories/food/ready-meals" className="text-orange-600 font-medium mt-2 inline-block hover:underline">Order Now →</a>
            </div>
            <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">🌍</span>
                <h3 className="text-xl font-bold text-orange-800">International</h3>
              </div>
              <p className="text-orange-700">Authentic flavors from around the world</p>
              <a href="/categories/food/international" className="text-orange-600 font-medium mt-2 inline-block hover:underline">Explore →</a>
            </div>
            <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">🇵🇭</span>
                <h3 className="text-xl font-bold text-orange-800">Local Delicacies</h3>
              </div>
              <p className="text-orange-700">Traditional Filipino favorites and specialties</p>
              <a href="/categories/food/local-delicacies" className="text-orange-600 font-medium mt-2 inline-block hover:underline">Taste →</a>
            </div>
          </div>
        </section>
      </div>

      {/* Featured Banner Section */}
      <BannerSection />
      
      {/* Popular Brands */}
      {/* <HomePopularBrandsSection />*/}
      
      {/* Shop by Style */}
      <ShopByStyleSection />
      
      {/* Blog Section */}
      <BlogSection />
    </main>
  )
}
