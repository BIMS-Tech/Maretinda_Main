// DISABLED: Payout module removed (Stripe dependency removed)
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

export const createPayoutOnboardingStep = createStep(
  'create-payout-onboarding',
  async (_input: any, _context) => {
    // Disabled - payout functionality removed
    return new StepResponse({ id: 'disabled' }, 'disabled')
  }
)
