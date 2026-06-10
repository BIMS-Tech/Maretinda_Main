import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * @oas [get] /seller/product-tags
 * operationId: "sellerListProductTags"
 * summary: "List Product Tags"
 * description: "Retrieves a list of product tags available for sellers."
 * x-authenticated: true
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    // Check if scope and query are available
    if (!req.scope) {
      console.error('[seller Product Tags] Request scope is undefined')
      return res.json({
        product_tags: [],
        count: 0,
        offset: 0,
        limit: 1000
      })
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    if (!query) {
      console.error('[seller Product Tags] Query service not available')
      return res.json({
        product_tags: [],
        count: 0,
        offset: 0,
        limit: 1000
      })
    }

    const { data: product_tags, metadata } = await query.graph({
      entity: 'product_tag',
      fields: req.queryConfig?.fields || ['id', 'value'],
      filters: req.filterableFields || {},
      pagination: req.queryConfig?.pagination || { skip: 0, take: 1000 }
    })

    res.json({
      product_tags: product_tags || [],
      count: metadata?.count || 0,
      offset: metadata?.skip || 0,
      limit: metadata?.take || 1000
    })
  } catch (error) {
    console.error('[seller Product Tags] Error fetching product tags:', error)
    
    // Return empty list on error
    res.json({
      product_tags: [],
      count: 0,
      offset: 0,
      limit: 1000
    })
  }
}



