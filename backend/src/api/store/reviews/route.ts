import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { createReviewWorkflow } from '@mercurjs/reviews/workflows'

/**
 * Get reviews for the authenticated customer
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    const limit = Number(req.query.limit) || 50
    const offset = Number(req.query.offset) || 0
    
    // Query customer with their reviews
    const { data: customers } = await query.graph({
      entity: 'customer',
      fields: [
        'reviews.id',
        'reviews.reference',
        'reviews.rating',
        'reviews.customer_note',
        'reviews.seller_note',
        'reviews.created_at',
        'reviews.updated_at',
        'reviews.order.id',
        'reviews.seller.id',
        'reviews.seller.name'
      ],
      filters: {
        id: req.auth_context.actor_id
      }
    })

    const reviews = customers[0]?.reviews || []

    res.json({
      reviews,
      count: reviews.length,
      offset,
      limit
    })
  } catch (error) {
    console.error('[Store Reviews GET] Error:', error)
    res.status(500).json({
      message: 'Failed to fetch reviews',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * Create a review (product or seller)
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const body = req.body as {
      reference: string
      reference_id: string
      rating: number
      customer_note?: string
      order_id?: string
    }
    const { reference, reference_id, rating, customer_note, order_id } = body

    // Use the package's workflow - it handles all linking
    const { result: review } = await createReviewWorkflow.run({
      container: req.scope,
      input: {
        reference,
        reference_id,
        rating,
        customer_note,
        seller_note: null,
        customer_id: req.auth_context.actor_id,
        order_id
      }
    })

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: [createdReview] } = await query.graph({
      entity: 'review',
      fields: ['id', 'reference', 'rating', 'customer_note', 'created_at'],
      filters: {
        id: review.id
      }
    })

    res.status(201).json({ review: createdReview })
  } catch (error) {
    console.error('[Store Reviews POST] Error:', error)
    res.status(500).json({
      message: 'Failed to create review',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

