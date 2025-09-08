import { ProductListingSkeleton } from "@/components/organisms/ProductListingSkeleton/ProductListingSkeleton"
import { getCategoryByHandle } from "@/lib/data/categories"
import { Suspense } from "react"

import type { Metadata } from "next"
import { generateCategoryMetadata } from "@/lib/helpers/seo"
import { Breadcrumbs } from "@/components/atoms"
import { AlgoliaProductsListing, ProductListing } from "@/components/sections"
import { notFound } from "next/navigation"
import { primeCategories, categoryThemes, categoryStructure } from "@/data/categories"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

const ALGOLIA_ID = process.env.NEXT_PUBLIC_ALGOLIA_ID
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params

  // Try to get from new category structure first
  if (Object.keys(primeCategories).includes(category)) {
    return {
      title: `${primeCategories[category as keyof typeof primeCategories]} - Maretinda`,
      description: categoryThemes[category as keyof typeof categoryThemes]?.description || `Shop ${primeCategories[category as keyof typeof primeCategories]} products`,
    }
  }

  // Fallback to legacy category structure
  const cat = await getCategoryByHandle([category])
  return generateCategoryMetadata(cat)
}

async function Category({
  params,
}: {
  params: Promise<{
    category: string
    locale: string
  }>
}) {
  const { category: handle, locale } = await params

  // Check if this is one of our new main categories
  if (Object.keys(primeCategories).includes(handle)) {
    const categoryName = primeCategories[handle as keyof typeof primeCategories]
    const theme = categoryThemes[handle as keyof typeof categoryThemes]
    const subCategories = categoryStructure[handle as keyof typeof categoryStructure]

    const breadcrumbsItems = [
      {
        path: "/",
        label: "Home",
      },
      {
        path: "/categories",
        label: "Categories",
      },
      {
        path: `/categories/${handle}`,
        label: categoryName,
      },
    ]

    return (
      <main className="container">
        <div className="hidden md:block mb-2">
          <Breadcrumbs items={breadcrumbsItems} />
        </div>

        {/* Category Header */}
        <div className={`p-8 rounded-xl mb-8 ${theme.bgClass}`}>
          <div className="flex items-center">
            <span className="text-6xl mr-6">{theme.icon}</span>
            <div>
              <h1 className={`heading-xl uppercase ${theme.textClass} mb-2`}>{categoryName}</h1>
              <p className={`text-lg ${theme.textClass} opacity-80`}>{theme.description}</p>
            </div>
          </div>
        </div>

        {/* Sub-categories Grid */}
        <div className="mb-12">
          <h2 className="heading-lg mb-6">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Object.entries(subCategories).map(([subHandle, subName]) => (
              <LocalizedClientLink
                key={subHandle}
                href={`/categories/${handle}/${subHandle}`}
                className={`group p-6 rounded-lg border transition-all hover:shadow-lg hover:scale-105 ${theme.bgClass}`}
                style={{ 
                  borderColor: theme.primary + '30',
                  backgroundColor: theme.primary + '08'
                }}
              >
                <h3 className={`font-medium text-lg ${theme.textClass} group-hover:underline`}>
                  {subName}
                </h3>
                <p className={`text-sm ${theme.textClass} opacity-70 mt-2`}>
                  Explore {subName.toLowerCase()}
                </p>
              </LocalizedClientLink>
            ))}
          </div>
        </div>

        {/* Featured Products in Category */}
        <div>
          <h2 className="heading-lg mb-6">Featured Products</h2>
          <Suspense fallback={<ProductListingSkeleton />}>
            {!ALGOLIA_ID || !ALGOLIA_SEARCH_KEY ? (
              <ProductListing showSidebar locale={locale} />
            ) : (
              <AlgoliaProductsListing
                locale={locale}
                // Add category filter here when integrating with backend
              />
            )}
          </Suspense>
        </div>
      </main>
    )
  }

  // Legacy category handling
  const category = await getCategoryByHandle([handle])

  if (!category) {
    return notFound()
  }

  const breadcrumbsItems = [
    {
      path: "/",
      label: "Home",
    },
    {
      path: "/categories",
      label: "Categories",
    },
    {
      path: `/categories/${category.handle}`,
      label: category.name,
    },
  ]

  return (
    <main className="container">
      <div className="hidden md:block mb-2">
        <Breadcrumbs items={breadcrumbsItems} />
      </div>

      <h1 className="heading-xl uppercase">{category.name}</h1>

      <Suspense fallback={<ProductListingSkeleton />}>
        {!ALGOLIA_ID || !ALGOLIA_SEARCH_KEY ? (
          <ProductListing category_id={category.id} showSidebar />
        ) : (
          <AlgoliaProductsListing category_id={category.id} locale={locale} />
        )}
      </Suspense>
    </main>
  )
}

export default Category
