// DISABLED: Payout module removed (Stripe dependency removed)
// This step is no longer active
import { createStep } from '@medusajs/framework/workflows-sdk'

export const validateNoExistingPayoutAccountForSellerStep = createStep(
  'validate-no-existing-payout-account-for-seller',
  async (_sellerId: string, _context) => {
    // Disabled - payout functionality removed
    // This step no longer validates payout accounts
    return
  }
)
