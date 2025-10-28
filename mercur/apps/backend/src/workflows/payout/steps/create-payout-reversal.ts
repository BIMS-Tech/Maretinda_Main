// DISABLED: Payout module removed (Stripe dependency removed)
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

export const createPayoutReversalStep = createStep(
  'create-payout-reversal',
  async (_input: any, _context) => {
    // Disabled - payout functionality removed
    return new StepResponse({
      payoutReversal: null,
      err: false
    })
  }
)
