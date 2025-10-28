// DISABLED: Payout module removed (Stripe dependency removed)
// This subscriber has been disabled because the payout module is no longer in use
// If you need payout functionality in the future, you'll need to implement a 
// non-Stripe alternative

/*
Original payout webhook handler disabled - Stripe dependency removed
This file needs to be reimplemented if payout functionality is required
without Stripe integration.
*/

// Export empty to prevent import errors
export default async function payoutWebhookHandler() {
  // Disabled - no operation
}

export const config = {
  event: 'disabled',
  context: {
    subscriberId: 'payout-webhook-handler-disabled'
  }
}
