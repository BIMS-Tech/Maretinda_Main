// DISABLED: Stripe removed - no longer needed
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

export const syncStripeAccountStep = createStep(
  'sync-stripe-account',
  async (_input: any, _context) => {
    // Disabled - Stripe functionality removed
    return new StepResponse({ synced: false }, 'disabled')
  }
)
