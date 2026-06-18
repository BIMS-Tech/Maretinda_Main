/**
 * Helpers to keep a product's brand in sync with its Algolia record.
 *
 * Brand is stored in raw tables (`brand`, `product_brand`) — matching the
 * shipping tables' pattern — to avoid depending on module migrations.
 *
 * The Mercur Algolia plugin rebuilds product records without brand (its zod
 * validator strips unknown fields) and writes them with addObject (full
 * replace). We therefore patch `brand` onto the record directly via the algolia
 * module's partialUpdate. A product edit re-runs the plugin's full replace,
 * which can drop brand until it's re-applied — the `algolia-brand-sync`
 * subscriber and the admin reindex endpoint re-apply it.
 */

import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

type Container = { resolve: (key: string) => any }

const PRODUCT_INDEX = 'products'

function getPg(container: Container): any {
  try {
    return container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  } catch {
    return (container as any).__pg_connection__ || (container as any).pgConnection
  }
}

function getAlgolia(container: Container): any | null {
  try {
    return container.resolve('algolia')
  } catch {
    return null
  }
}

/** Resolve the brand (if any) linked to each product id, via raw tables. */
async function getProductBrands(
  container: Container,
  productIds: string[],
): Promise<Record<string, { id: string; name: string } | null>> {
  const pg = getPg(container)
  const rows = await pg('product_brand as pb')
    .join('brand as b', 'b.id', 'pb.brand_id')
    .whereIn('pb.product_id', productIds)
    .whereNull('pb.deleted_at')
    .whereNull('b.deleted_at')
    .select('pb.product_id as product_id', 'b.id as brand_id', 'b.name as brand_name')

  const map: Record<string, { id: string; name: string } | null> = {}
  for (const id of productIds) map[id] = null
  for (const r of rows) {
    map[r.product_id] = { id: r.brand_id, name: r.brand_name }
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
      return algolia
        .partialUpdate(PRODUCT_INDEX, {
          id,
          brand: brand ? { id: brand.id, name: brand.name } : null,
        })
        .catch(() => undefined)
    }),
  )
}

/** Re-apply brand to every product that currently has one. Returns the count. */
export async function reindexAllBrands(container: Container): Promise<number> {
  const pg = getPg(container)
  const rows = await pg('product_brand')
    .whereNull('deleted_at')
    .distinct('product_id')
    .select('product_id')
  const ids = rows.map((r: any) => r.product_id)
  await applyBrandToAlgolia(container, ids)
  return ids.length
}
