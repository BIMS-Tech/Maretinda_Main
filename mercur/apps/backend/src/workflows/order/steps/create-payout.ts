// DISABLED: Payout module removed (Stripe dependency removed)
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

export const createPayoutStep = createStep(
  'create-payout',
  async (_input: any, _context) => {
    // Disabled - payout functionality removed
    return new StepResponse({
      payout: null,
      err: false
    })
  }
)
