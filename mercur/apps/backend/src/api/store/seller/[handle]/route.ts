import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerReview from '../../../../links/seller-review'

/**
 * @oas [get] /store/seller/{handle}
 * operationId: "StoreGetSellerByHandle"
 * summary: "Get seller"
 * description: "Retrieves seller of specified handle"
 * parameters:
 *   - in: path
 *     name: handle
 *     required: true
 *     description: The handle of the seller
 *     schema:
 *       type: string
 *   - name: fields
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Comma-separated fields to include in the response.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             product:
 *               $ref: "#/components/schemas/StoreSeller"
 * tags:
 *   - Seller
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [seller]
  } = await query.graph({
    entity: 'seller',
    fields: req.queryConfig.fields.filter(f => !f.startsWith('reviews')),
    filters: {
      handle: req.params.handle
    }
  })

  if (!seller) {
    return res.json({ seller: null })
  }

  // Fetch reviews through the link table if requested
  const wantsReviews = req.queryConfig.fields.some(f => f.startsWith('reviews'))
  let reviews = []
  
  if (wantsReviews) {
    const reviewFields = req.queryConfig.fields
      .filter(f => f.startsWith('reviews.'))
      .map(f => `review.${f.replace('reviews.', '')}`)
    
    const { data: reviewRelations } = await query.graph({
      entity: sellerReview.entryPoint,
      fields: reviewFields.length ? reviewFields : ['review.*', 'review.customer.*'],
      filters: {
        seller_id: seller.id
      }
    })

    reviews = reviewRelations.map((relation) => relation.review)
  }

  res.json({
    seller: {
      ...seller,
      reviews: wantsReviews ? reviews : undefined
    }
  })
}
