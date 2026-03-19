import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  MedusaRequest
} from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { 
  calculateWishlistProductsPrice,
  getWishlistFromCustomerId,
  WISHLIST_MODULE
} from '@mercurjs/b2c-core/modules/wishlist'
import { createWishlistEntryWorkflow } from '@mercurjs/b2c-core/workflows'

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  // Check authentication
  if (!(req as any).auth_context || !(req as any).auth_context.actor_id) {
    return res.status(401).json({
      message: "Authentication required. Please log in to add items to your wishlist."
    })
  }

  try {
    // Check if product is already in wishlist
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    const { data: existingWishlists } = await query.graph({
      entity: 'customer',
      fields: ['wishlist.products.id'],
      filters: {
        id: (req as any).auth_context.actor_id
      }
    })

    // Check if the product already exists in any wishlist
    const productId = (req as any).validatedBody.reference_id
    const alreadyInWishlist = existingWishlists.some((relation: any) => 
      relation.wishlist?.products?.some((p: any) => p.id === productId)
    )

    if (alreadyInWishlist) {
      return res.status(200).json({
        message: "Product is already in your wishlist",
        already_exists: true
      })
    }

    // Add to wishlist
    const { result } = await createWishlistEntryWorkflow.run({
      container: req.scope,
      input: {
        ...(req as any).validatedBody,
        customer_id: (req as any).auth_context.actor_id
      }
    })

    const {
      data: [wishlist]
    } = await query.graph({
      entity: 'wishlist',
      fields: req.queryConfig.fields,
      filters: {
        id: result.id
      }
    })

    res.status(201).json({ 
      wishlist,
      message: "Product added to wishlist successfully"
    })
  } catch (error: any) {
    // Handle duplicate entry error gracefully
    if (error.message?.includes('Cannot create multiple links')) {
      return res.status(200).json({
        message: "Product is already in your wishlist",
        already_exists: true
      })
    }
    
    console.error('[Wishlist POST] Error:', error)
    return res.status(500).json({
      message: "Failed to add product to wishlist",
      error: error.message
    })
  }
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  // Check authentication - return empty wishlist for unauthenticated users
  if (!(req as any).auth_context || !(req as any).auth_context.actor_id) {
    return res.json({
      wishlists: [],
      count: 0,
      offset: 0,
      limit: (req as any).queryConfig?.pagination?.take || 15
    })
  }

  try {
    // Get wishlist for customer using the utility function
    const wishlist = await getWishlistFromCustomerId(
      req.scope,
      (req as any).auth_context.actor_id
    )

    // If no wishlist exists, return empty
    if (!wishlist) {
      return res.json({
        wishlists: [],
        count: 0,
        offset: 0,
        limit: (req as any).queryConfig?.pagination?.take || 15
      })
    }

    // Now query the wishlist with products and variants
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const { data: wishlists } = await query.graph({
      entity: 'wishlist',
      fields: [
        'id',
        'products',
        ...((req as any).queryConfig.fields || []).map((field: string) => `products.${field}`),
        'products.id',
        'products.variants',
        'products.variants.*',
        'products.variants.id',
        'products.variants.prices',
        'products.variants.prices.*'
      ],
      filters: {
        id: wishlist.id
      }
    })

    // Check if we have any wishlists at all
    if (!wishlists || wishlists.length === 0) {
      return res.json({
        wishlists: [],
        count: 0,
        offset: 0,
        limit: (req as any).queryConfig?.pagination?.take || 15
      })
    }

    // Filter out any invalid data before processing
    const validWishlists = wishlists.map((wl: any) => {
      if (!wl || !wl.products) return wl
      
      return {
        ...wl,
        products: wl.products.filter((p: any) => {
          // Filter out products without id or without valid variants
          if (!p || !p.id) return false
          if (!p.variants || !Array.isArray(p.variants)) return false
          // Filter out products where all variants are invalid
          const hasValidVariant = p.variants.some((v: any) => v && v.id)
          return hasValidVariant
        }).map((p: any) => ({
          ...p,
          // Also filter out invalid variants from each product
          variants: p.variants.filter((v: any) => v && v.id)
        }))
      }
    }).filter((wl: any) => wl && wl.products && wl.products.length > 0)

    if (validWishlists.length === 0) {
      return res.json({
        wishlists: [],
        count: 0,
        offset: 0,
        limit: (req as any).queryConfig?.pagination?.take || 15
      })
    }

    const formattedWithPrices = await calculateWishlistProductsPrice(
      req.scope,
      validWishlists.map((wl: any) => ({ wishlist_id: wl.id, wishlist: wl }))
    )

    res.json({
      wishlists: formattedWithPrices,
      count: formattedWithPrices.length,
      offset: 0,
      limit: (req as any).queryConfig?.pagination?.take || 15
    })
  } catch (error: any) {
    console.error('[Wishlist GET] Error:', error.message)
    return res.status(500).json({
      message: "Failed to retrieve wishlist",
      error: error.message,
      wishlists: [],
      count: 0,
      offset: 0,
      limit: (req as any).queryConfig?.pagination?.take || 15
    })
  }
}




