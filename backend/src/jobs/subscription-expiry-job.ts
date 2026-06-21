import { MedusaContainer } from "@medusajs/framework/types"
import SubscriptionService from "../services/subscription"

export const config = {
  name: "subscription-expiry",
  schedule: "0 * * * *", // hourly, on the hour
}

/**
 * Flips active subscriptions/trials whose end_date has passed to "expired",
 * so that entitlement checks reading `status = 'active'` stay correct.
 * Also ensures the one-trial-per-seller DB guard exists.
 */
export default async function subscriptionExpiry(container: MedusaContainer): Promise<void> {
  try {
    const service = new SubscriptionService(container)
    await service.initConstraints()
    const expired = await service.expireOverdue()
    if (expired > 0) {
      console.log(`[SubscriptionExpiry] expired ${expired} overdue subscription(s)`)
    }
  } catch (error) {
    console.error("[SubscriptionExpiry] Error:", error)
  }
}
