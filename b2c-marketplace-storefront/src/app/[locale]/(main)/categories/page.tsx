import { ProductListingSkeleton } from "@/components/organisms/ProductListingSkeleton/ProductListingSkeleton"
import { Suspense } from "react"

import { Breadcrumbs } from "@/components/atoms"
import { AlgoliaProductsListing, ProductListing } from "@/components/sections"
import { getRegion } from "@/lib/data/regions"
import { primeCategories, categoryThemes, categoryStructure } from "@/data/categories"
import { CategoryCard } from "@/components/organisms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

const ALGOLIA_ID = process.env.NEXT_PUBLIC_ALGOLIA_ID
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY

async function AllCategories({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const breadcrumbsItems = [
    {
      path: "/",
      label: "Home",
    },
    {
      path: "/categories",
      label: "All Categories",
    },
  ]

  const currency_code = (await getRegion(locale))?.currency_code || "usd"

  const categories = Object.entries(primeCategories).map(([handle, name], index) => ({
    id: index + 1,
    name,
    handle,
    theme: categoryThemes[handle as keyof typeof categoryThemes],
  }))

  return (
    <main className="container">
      <div className="hidden md:block mb-2">
        <Breadcrumbs items={breadcrumbsItems} />
      </div>

      <div className="mb-8">
        <h1 className="heading-xl uppercase mb-4">Shop by Category</h1>
        <p className="text-gray-600 text-lg">
          Discover everything you need from groceries to fashion, all in one place
        </p>
      </div>

      {/* Main Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>

      {/* Sub-categories by Main Category */}
      <div className="space-y-12">
        {Object.entries(categoryStructure).map(([mainCategory, subCategories]) => {
          const theme = categoryThemes[mainCategory as keyof typeof categoryThemes]
          return (
            <section key={mainCategory} className={`p-8 rounded-xl ${theme.bgClass}`}>
              <div className="flex items-center mb-6">
                <span className="text-3xl mr-4">{theme.icon}</span>
                <div>
                  <h2 className={`text-2xl font-bold ${theme.textClass} mb-2`}>
                    {primeCategories[mainCategory as keyof typeof primeCategories]}
                  </h2>
                  <p className={`${theme.textClass} opacity-80`}>
                    {theme.description}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(subCategories).map(([handle, name]) => (
                  <LocalizedClientLink
                    key={handle}
                    href={`/categories/${mainCategory}/${handle}`}
                    className={`p-4 rounded-lg border transition-all hover:shadow-md hover:scale-105 ${theme.bgClass}`}
                    style={{ 
                      borderColor: theme.primary + '30',
                      backgroundColor: theme.primary + '08'
                    }}
                  >
                    <h3 className={`font-medium ${theme.textClass}`}>{name}</h3>
                  </LocalizedClientLink>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* All Products Section */}
      <div className="mt-16">
        <h2 className="heading-lg uppercase mb-8">Browse All Products</h2>
        <Suspense fallback={<ProductListingSkeleton />}>
          {!ALGOLIA_ID || !ALGOLIA_SEARCH_KEY ? (
            <ProductListing showSidebar locale={locale} />
          ) : (
            <AlgoliaProductsListing
              locale={locale}
              currency_code={currency_code}
            />
          )}
        </Suspense>
      </div>
    </main>
  )
}

export default AllCategories
