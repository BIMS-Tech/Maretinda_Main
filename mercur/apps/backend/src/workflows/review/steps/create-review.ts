import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { CreateReviewDTO } from '@mercurjs/framework'
import { REVIEW_MODULE, ReviewModuleService } from '@mercurjs/reviews'

export const createReviewStep = createStep(
  'create-review',
  async (input: CreateReviewDTO, { container }) => {
    const service = container.resolve<ReviewModuleService>(REVIEW_MODULE)
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    const review = await service.createReviews(input)

    // Create base links for customer and order
    const links = [
      {
        [Modules.CUSTOMER]: {
          customer_id: input.customer_id
        },
        [REVIEW_MODULE]: {
          review_id: review.id
        }
      },
      {
        [Modules.ORDER]: {
          order_id: input.order_id
        },
        [REVIEW_MODULE]: {
          review_id: review.id
        }
      }
    ]

    // If this is a product review, link it to the product
    if (input.reference === 'product' && input.reference_id) {
      links.push({
        [Modules.PRODUCT]: {
          product_id: input.reference_id
        },
        [REVIEW_MODULE]: {
          review_id: review.id
        }
      })
    }

    await link.create(links)
    return new StepResponse(review)
  }
)
