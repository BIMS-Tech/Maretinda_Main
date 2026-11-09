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
  if (!req.auth_context?.actor_id) {
    res.status(401).json({ message: 'Sign in to see your reviews' })
    return
  }

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
      message: 'Failed to fetch reviews'
    })
  }
}

/**
 * Reviews count only from real buyers: the order must be the customer's own and
 * contain that product, or come from that seller.
 */
async function customerBoughtFrom(
  pg: any,
  customerId: string,
  reference: string,
  referenceId: string,
  orderId?: string
): Promise<boolean> {
  if (typeof orderId !== 'string' || !orderId) return false

  const order = await pg('order').where({ id: orderId, customer_id: customerId }).whereNull('deleted_at').first()
  if (!order) return false

  if (reference === 'seller') {
    const link = await pg('seller_seller_order_order')
      .where({ seller_id: referenceId, order_id: orderId })
      .whereNull('deleted_at')
      .first()
    return Boolean(link)
  }

  const items = await pg.raw(
    `SELECT 1
       FROM order_item oi
       JOIN order_line_item li ON li.id = oi.item_id
      WHERE oi.order_id = ? AND li.product_id = ? AND oi.deleted_at IS NULL
      LIMIT 1`,
    [orderId, referenceId]
  )
  return items.rows.length > 0
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

    const customerId = req.auth_context?.actor_id
    if (!customerId) {
      res.status(401).json({ message: 'Sign in to leave a review' })
      return
    }
    if (reference !== 'seller' && reference !== 'product') {
      res.status(400).json({ message: 'reference must be seller or product' })
      return
    }
    if (typeof reference_id !== 'string' || !reference_id) {
      res.status(400).json({ message: 'reference_id is required' })
      return
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      res.status(400).json({ message: 'rating must be a whole number from 1 to 5' })
      return
    }
    if (customer_note != null && (typeof customer_note !== 'string' || customer_note.length > 2000)) {
      res.status(400).json({ message: 'Your review is too long' })
      return
    }
    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    if (!(await customerBoughtFrom(pg, customerId, reference, reference_id, order_id))) {
      res.status(403).json({ message: 'You can only review what you have ordered' })
      return
    }

    // Use the package's workflow - it handles all linking
    const { result: review } = await createReviewWorkflow.run({
      container: req.scope,
      input: {
        reference,
        reference_id,
        rating,
        customer_note,
        seller_note: null,
        customer_id: customerId,
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
    res.status(500).json({ message: 'Failed to create review' })
  }
}

