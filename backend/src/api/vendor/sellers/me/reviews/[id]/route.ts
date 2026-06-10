import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
// Note: using pgConnection directly since query.graph requires admin actor for 'review' entity

/**
 * Get a single review by ID
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    const memberId = (req as any).auth_context?.actor_id || (req as any).user?.id

    let pgConnection: any
    try {
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch (e) {
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    if (!pgConnection) {
      return res.status(500).json({ message: 'Database connection not available' })
    }

    // Get seller_id from member
    const member = await pgConnection('member').where('id', memberId).first()
    if (!member?.seller_id) {
      return res.status(404).json({ message: 'Seller not found' })
    }

    // Fetch review with customer info via join
    const review = await pgConnection('review')
      .leftJoin('customer', 'review.customer_id', 'customer.id')
      .leftJoin('product', 'review.product_id', 'product.id')
      .where('review.id', id)
      .select(
        'review.id',
        'review.reference',
        'review.rating',
        'review.customer_note',
        'review.seller_note',
        'review.created_at',
        'review.updated_at',
        'review.customer_id',
        'review.product_id',
        'customer.first_name as customer_first_name',
        'customer.last_name as customer_last_name',
        'customer.email as customer_email',
        'product.title as product_title',
        'product.thumbnail as product_thumbnail'
      )
      .first()

    if (!review) {
      return res.status(404).json({ message: `Review ${id} not found` })
    }

    res.json({
      review: {
        id: review.id,
        reference: review.reference,
        rating: review.rating,
        customer_note: review.customer_note,
        seller_note: review.seller_note,
        created_at: review.created_at,
        updated_at: review.updated_at,
        customer: review.customer_id ? {
          id: review.customer_id,
          first_name: review.customer_first_name,
          last_name: review.customer_last_name,
          email: review.customer_email,
        } : null,
        product: review.product_id ? {
          id: review.product_id,
          title: review.product_title,
          thumbnail: review.product_thumbnail,
        } : null,
      }
    })
  } catch (error) {
    console.error('[seller Review Detail] Error:', error)
    res.status(500).json({
      message: 'Failed to fetch review',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * Update review (add seller response)
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    const body = req.body as { seller_note?: string }
    const { seller_note } = body

    let pgConnection: any
    try {
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch (e) {
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    if (!pgConnection) {
      return res.status(500).json({
        message: 'Database connection not available'
      })
    }

    const result = await pgConnection('review')
      .where('id', id)
      .update({
        seller_note,
        updated_at: new Date()
      })
      .returning('*')

    const updatedReview = Array.isArray(result) ? result[0] : result

    if (!updatedReview) {
      return res.status(404).json({
        message: 'Review not found'
      })
    }

    res.json({
      review: updatedReview
    })
  } catch (error) {
    console.error('[seller Review Update] Error:', error)
    res.status(500).json({
      message: 'Failed to update review',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

