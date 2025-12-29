import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * Get ALL reviews for vendor (seller reviews + product reviews)
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    // Get member ID
    const memberId = (req as any).auth_context?.actor_id || (req as any).user?.id
    
    if (!memberId) {
      return res.status(401).json({
        message: 'Unauthorized',
        reviews: [],
        count: 0
      })
    }

    // Get database connection
    let pgConnection: any
    try {
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch (e) {
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    if (!pgConnection) {
      return res.status(500).json({
        message: 'Database connection not available',
        reviews: [],
        count: 0
      })
    }

    // Get seller_id from member table
    const member = await pgConnection('member')
      .where('id', memberId)
      .first()

    if (!member || !member.seller_id) {
      return res.status(404).json({
        message: 'Seller not found',
        reviews: [],
        count: 0
      })
    }

    const sellerId = member.seller_id

    // Get seller with reviews and products.reviews
    const { data: sellerData } = await query.graph({
      entity: 'seller',
      fields: [
        'id',
        'name',
        'reviews.id',
        'reviews.reference',
        'reviews.rating',
        'reviews.customer_note',
        'reviews.seller_note',
        'reviews.created_at',
        'reviews.updated_at',
        'reviews.customer.id',
        'reviews.customer.first_name',
        'reviews.customer.last_name',
        'reviews.customer.email',
        'products.id',
        'products.title',
        'products.thumbnail',
        'products.reviews.id',
        'products.reviews.reference',
        'products.reviews.rating',
        'products.reviews.customer_note',
        'products.reviews.seller_note',
        'products.reviews.created_at',
        'products.reviews.updated_at',
        'products.reviews.customer.id',
        'products.reviews.customer.first_name',
        'products.reviews.customer.last_name',
        'products.reviews.customer.email'
      ],
      filters: {
        id: sellerId
      }
    })

    if (!sellerData || sellerData.length === 0) {
      return res.json({
        reviews: [],
        count: 0
      })
    }

    const seller = sellerData[0]

    // Get seller reviews
    const sellerReviews = seller.reviews || []

    // Get product reviews and attach product info
    const productReviews = (seller.products || []).flatMap((p: any) => 
      (p.reviews || []).map((r: any) => ({
        ...r,
        product: {
          id: p.id,
          title: p.title,
          thumbnail: p.thumbnail
        }
      }))
    )

    // Combine all reviews
    const allReviews = [...sellerReviews, ...productReviews]

    res.json({
      reviews: allReviews,
      count: allReviews.length,
      offset: 0,
      limit: allReviews.length
    })
  } catch (error) {
    console.error('[Vendor Reviews] Error:', error)
    res.status(500).json({
      message: 'Failed to fetch reviews',
      error: error instanceof Error ? error.message : 'Unknown error',
      reviews: [],
      count: 0
    })
  }
}

