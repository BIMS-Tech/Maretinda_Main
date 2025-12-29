import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { REVIEW_MODULE, ReviewModuleService } from '@mercurjs/reviews'

/**
 * @oas [get] /admin/reviews/{id}
 * operationId: "AdminGetReviewById"
 * summary: "Get review by id"
 * description: "Retrieves a review by id."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Review.
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
 *             review:
 *               $ref: "#/components/schemas/Review"
 * tags:
 *   - Admin Reviews
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [review]
  } = await query.graph({
    entity: 'review',
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.json({ review })
}

/**
 * @oas [delete] /admin/reviews/{id}
 * operationId: "AdminDeleteReview"
 * summary: "Delete a review"
 * description: "Deletes a review by id. Admin can delete reviews based on vendor request."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Review to delete.
 *     schema:
 *       type: string
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: The ID of the deleted review
 *             deleted:
 *               type: boolean
 *               description: Whether the review was deleted successfully
 * tags:
 *   - Admin Reviews
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const reviewService = req.scope.resolve<ReviewModuleService>(REVIEW_MODULE)
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK)

  // Delete the review
  await reviewService.deleteReviews(req.params.id)

  // Also delete any links associated with this review
  await link.dismiss({
    [REVIEW_MODULE]: {
      review_id: req.params.id
    }
  })

  res.json({
    id: req.params.id,
    deleted: true
  })
}
