// DISABLED: Payout module removed (Stripe dependency removed)
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

export const updatePayoutAccountStep = createStep(
  'update-payout-account',
  async (_input: any, _context) => {
    // Disabled - payout functionality removed
    return new StepResponse({ id: 'disabled' }, { id: 'disabled' })
  },
  async (_previousData: any, _context) => {
    // Disabled - no cleanup needed
  }
)
