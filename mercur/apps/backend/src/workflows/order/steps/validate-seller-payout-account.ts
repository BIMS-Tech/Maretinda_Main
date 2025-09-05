import { createStep } from '@medusajs/framework/workflows-sdk'
import { MedusaError } from '@medusajs/utils'

import { SellerWithPayoutAccountDTO } from '@mercurjs/framework'
import { PayoutAccountStatus } from '@mercurjs/framework'

export const validateSellerPayoutAccountStep = createStep(
  'validate-seller-payout-account',
  async (seller: SellerWithPayoutAccountDTO) => {
    if (!seller.payout_account) {
      console.log(`Seller ${seller.id} has no payout account - skipping payout processing`)
      // Don't throw error, just log and continue
      return { hasPayoutAccount: false }
    }

    if (seller.payout_account.status !== PayoutAccountStatus.ACTIVE) {
      console.log(`Seller ${seller.id} payout account is not active (status: ${seller.payout_account.status}) - skipping payout processing`)
      // Don't throw error, just log and continue
      return { hasPayoutAccount: true, isActive: false }
    }

    return { hasPayoutAccount: true, isActive: true }
  }
)
