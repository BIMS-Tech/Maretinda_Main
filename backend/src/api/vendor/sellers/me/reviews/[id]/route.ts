import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * Get a single review by ID
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const { data: reviews } = await query.graph({
      entity: 'review',
      fields: [
        'id',
        'reference',
        'rating',
        'customer_note',
        'seller_note',
        'created_at',
        'updated_at',
        'customer.id',
        'customer.first_name',
        'customer.last_name',
        'customer.email',
        'product.id',
        'product.title',
        'product.thumbnail',
        'seller.id',
        'seller.name'
      ],
      filters: {
        id
      }
    })

    if (!reviews || reviews.length === 0) {
      return res.status(404).json({
        message: `Review ${id} not found`
      })
    }

    res.json({
      review: reviews[0]
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
    console.error('[Vendor Review Update] Error:', error)
    res.status(500).json({
      message: 'Failed to update review',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

