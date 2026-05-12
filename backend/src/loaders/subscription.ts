import { MedusaContainer } from "@medusajs/framework/types"
import SubscriptionService from "../services/subscription"

export default async function subscriptionLoader(container: MedusaContainer): Promise<void> {
  console.log("[Subscription Loader] Registering subscription service")
  try {
    container.register({
      subscriptionService: {
        resolve: () => new SubscriptionService(container),
        lifetime: "SINGLETON",
      },
    })
    console.log("[Subscription Loader] Done")
  } catch (error) {
    console.error("[Subscription Loader] Failed:", error)
  }
}
