import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
// Note: using pgConnection directly since query.graph requires admin actor for 'review' entity
// Note: using /vendor/sellers/me/review/:id (singular) to avoid Mercur's checkResourceOwnershipByResourceId
// middleware on /vendor/sellers/me/reviews/:id which only checks seller_review links (not product_review links)
//
// Link tables discovered from DB schema:
//   customer_customer_review_review: customer_id, review_id
//   product_product_review_review:   product_id,  review_id

/**
 * Get a single review by ID (works for both seller reviews and product reviews)
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

    // Verify member belongs to a seller
    const member = await pgConnection('member').where('id', memberId).first()
    if (!member?.seller_id) {
      return res.status(404).json({ message: 'Seller not found' })
    }

    // Fetch review + customer (via link table) + product (via link table)
    const review = await pgConnection('review')
      .leftJoin(
        'customer_customer_review_review as cr_link',
        'cr_link.review_id', 'review.id'
      )
      .leftJoin('customer', 'customer.id', 'cr_link.customer_id')
      .leftJoin(
        'product_product_review_review as pr_link',
        'pr_link.review_id', 'review.id'
      )
      .leftJoin('product', 'product.id', 'pr_link.product_id')
      .where('review.id', id)
      .where(function () {
        this.whereNull('cr_link.deleted_at').orWhereNull('cr_link.review_id')
      })
      .where(function () {
        this.whereNull('pr_link.deleted_at').orWhereNull('pr_link.review_id')
      })
      .select(
        'review.id',
        'review.reference',
        'review.rating',
        'review.customer_note',
        'review.seller_note',
        'review.created_at',
        'review.updated_at',
        'cr_link.customer_id',
        'customer.first_name as customer_first_name',
        'customer.last_name as customer_last_name',
        'customer.email as customer_email',
        'pr_link.product_id',
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
    console.error('[Vendor Review Detail] Error:', error)
    res.status(500).json({
      message: 'Failed to fetch review',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * Update review (add/edit/delete seller reply)
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
    console.error('[Vendor Review Update] Error:', error)
    res.status(500).json({
      message: 'Failed to update review',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
