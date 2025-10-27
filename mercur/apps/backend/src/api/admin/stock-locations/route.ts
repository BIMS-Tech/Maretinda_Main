import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * WORKAROUND for Medusa bug: The framework incorrectly generates SQL queries
 * when fetching seller relationships through link tables. It tries to reference
 * `s2.seller_id` but the seller table only has `id` column.
 * 
 * Proper SQL should be:
 *   SELECT * FROM stock_location sl
 *   LEFT JOIN seller_seller_stock_location_stock_location link 
 *     ON sl.id = link.stock_location_id
 *   LEFT JOIN seller s ON link.seller_id = s.id
 * 
 * But Medusa generates: ... s2.seller_id ... (which doesn't exist)
 * 
 * Until this is fixed in Medusa framework, we fetch stock locations without
 * seller data and manually fetch seller info if needed.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const knex = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  
  // Fetch stock locations without seller data to avoid the Medusa SQL bug
  const { data: stockLocations, metadata } = await query.graph({
    entity: 'stock_location',
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination
  })

  // Manually check which stock locations have sellers using the link table
  // This bypasses Medusa's buggy SQL generation
  const stockLocationIds = stockLocations.map(sl => sl.id)
  
  let linkedSellers: any[] = []
  if (stockLocationIds.length > 0) {
    linkedSellers = await knex
      .select('stock_location_id', 'seller_id')
      .from('seller_seller_stock_location_stock_location')
      .whereIn('stock_location_id', stockLocationIds)
      .whereNull('deleted_at')
  }

  // Create a Set of stock location IDs that have sellers
  const stockLocationsWithSellers = new Set(linkedSellers.map(link => link.stock_location_id))

  // Filter out stock locations that belong to sellers (vendor-specific)
  // Admin should only see marketplace stock locations
  const filteredStockLocations = stockLocations.filter(
    (stockLocation) => !stockLocationsWithSellers.has(stockLocation.id)
  )

  res.json({
    stock_locations: filteredStockLocations,
    count: filteredStockLocations.length,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
