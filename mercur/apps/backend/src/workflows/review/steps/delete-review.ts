import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { REVIEW_MODULE, ReviewModuleService } from '@mercurjs/reviews'

export const deleteReviewStep = createStep(
  'delete-review',
  async (id: string, { container }) => {
    const service = container.resolve<ReviewModuleService>(REVIEW_MODULE)
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    // Delete all links associated with this review
    await link.dismiss({
      [REVIEW_MODULE]: {
        review_id: id
      }
    })

    // Hard delete the review
    await service.deleteReviews(id)

    return new StepResponse(id)
  }
)
