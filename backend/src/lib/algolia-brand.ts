/**
 * Helpers to keep a product's brand in sync with its Algolia record.
 *
 * The Mercur Algolia plugin rebuilds product records without brand (its zod
 * validator strips unknown fields) and writes them with addObject (full
 * replace). We therefore patch `brand` onto the record directly via the algolia
 * module's partialUpdate, which the plugin cannot express.
 *
 * NOTE: a product edit re-runs the plugin's full replace, which can drop brand
 * until brand is re-applied. `reindexAllBrands` re-applies brand for every
 * product and is exposed via an admin endpoint for recovery/backfill.
 */

import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

type Container = { resolve: (key: string) => any }

const PRODUCT_INDEX = 'products'

function getAlgolia(container: Container): any | null {
  try {
    return container.resolve('algolia')
  } catch {
    return null
  }
}

/** Resolve the brand (if any) linked to each product id. */
async function getProductBrands(
  container: Container,
  productIds: string[],
): Promise<Record<string, { id: string; name: string } | null>> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: 'product',
    fields: ['id', 'brand.id', 'brand.name'],
    filters: { id: productIds },
  })
  const map: Record<string, { id: string; name: string } | null> = {}
  for (const p of data as any[]) {
    map[p.id] = p.brand ? { id: p.brand.id, name: p.brand.name } : null
  }
  return map
}

/** Push the current brand onto the Algolia records for the given products. */
export async function applyBrandToAlgolia(
  container: Container,
  productIds: string[],
): Promise<void> {
  if (!productIds.length) return
  const algolia = getAlgolia(container)
  if (!algolia) return

  const brands = await getProductBrands(container, productIds)
  await Promise.all(
    productIds.map((id) => {
      const brand = brands[id]
      // partialUpdate adds/clears the brand attribute without touching the rest.
      return algolia
        .partialUpdate(PRODUCT_INDEX, {
          id,
          brand: brand ? { id: brand.id, name: brand.name } : null,
        })
        .catch(() => undefined)
    }),
  )
}

/** Re-apply brand to every (non-deleted) product's Algolia record. */
export async function reindexAllBrands(container: Container): Promise<number> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: 'product',
    fields: ['id'],
    filters: { status: 'published' },
    pagination: { take: 1000, skip: 0 },
  })
  const ids = (data as any[]).map((p) => p.id)
  await applyBrandToAlgolia(container, ids)
  return ids.length
}
