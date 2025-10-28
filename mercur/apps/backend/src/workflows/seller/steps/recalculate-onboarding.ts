import { z } from 'zod'

import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { SELLER_MODULE, SellerModuleService } from '@mercurjs/seller'

// DISABLED: Payout module removed (Stripe dependency removed)
// import sellerPayoutAccount from '../../../links/seller-payout-account'
import sellerProduct from '../../../links/seller-product'
import sellerStockLocation from '../../../links/seller-stock-location'

export const recalculateOnboardingStep = createStep(
  'recalculate-onboarding',
  async (seller_id: string, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    /* Store information */
    // Fetch seller directly from service instead of query.graph to avoid SQL bug
    const sellerService = container.resolve<SellerModuleService>(SELLER_MODULE)
    const store = await sellerService.retrieveSeller(seller_id, {
      select: [
        'id',
        'name',
        'handle',
        'description',
        'photo',
        'address_line',
        'city',
        'postal_code',
        'country_code',
        'tax_id'
      ]
    })

    const { success: store_information } = z
      .object({
        name: z.string().min(1),
        handle: z.string().min(1),
        description: z.string().min(1),
        photo: z.string().nullish(),
        address_line: z.string().min(1),
        city: z.string().min(1),
        postal_code: z.string().min(1),
        country_code: z.string().min(1),
        tax_id: z.string().nullish()
      })
      .safeParse(store)

    /* Products added */
    const { data: sellerProducts } = await query.graph({
      entity: sellerProduct.entryPoint,
      fields: ['id'],
      filters: {
        seller_id
      }
    })

    const products = !!sellerProducts.length

    /* Shipping locations */
    const { data: sellerLocations } = await query.graph({
      entity: sellerStockLocation.entryPoint,
      fields: ['id'],
      filters: { seller_id }
    })
    const locations_shipping = !!sellerLocations.length

    /* Stripe connection - DISABLED (Stripe removed) */
    // Stripe connection is no longer checked since payout module is removed
    const stripe_connection = false // Always false since Stripe is removed

    /* Update onboarding */
    const {
      data: [onboarding]
    } = await query.graph({
      entity: 'seller_onboarding',
      fields: ['id'],
      filters: {
        seller_id
      }
    })

    const toUpdate = {
      seller_id,
      stripe_connection,
      products,
      store_information,
      locations_shipping
    }

    // sellerService already resolved above
    const updatedOnboarding = onboarding
      ? await sellerService.updateSellerOnboardings({
          ...toUpdate,
          id: onboarding.id
        })
      : await sellerService.createSellerOnboardings(toUpdate)

    return new StepResponse(updatedOnboarding)
  }
)
