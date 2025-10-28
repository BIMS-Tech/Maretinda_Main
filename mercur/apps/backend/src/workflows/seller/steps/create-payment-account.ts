// DISABLED: Payout module removed (Stripe dependency removed)
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

export const createPayoutAccountStep = createStep(
  'create-payout-account',
  async (_input: any, _context) => {
    // Disabled - payout functionality removed
    return new StepResponse({ id: 'disabled' }, 'disabled')
  },
  async (_id: string, _context) => {
    // Disabled - no cleanup needed
  }
)
