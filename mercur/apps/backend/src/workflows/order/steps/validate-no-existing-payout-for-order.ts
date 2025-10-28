// DISABLED: Payout module removed (Stripe dependency removed)
import { createStep } from '@medusajs/framework/workflows-sdk'

export const validateNoExistingPayoutForOrderStep = createStep(
  'validate-no-existing-payout-for-order',
  async (_id: string, _context) => {
    // Disabled - payout functionality removed
    // No validation needed since payouts are no longer used
    return
  }
)
