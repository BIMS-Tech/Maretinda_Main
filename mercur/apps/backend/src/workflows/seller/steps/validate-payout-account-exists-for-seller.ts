// DISABLED: Payout module removed (Stripe dependency removed)
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

export const validatePayoutAccountExistsForSellerStep = createStep(
  'validate-payout-account-exists-for-seller',
  async (_sellerId: string, _context) => {
    // Disabled - payout functionality removed
    return new StepResponse({ id: 'disabled' })
  }
)
