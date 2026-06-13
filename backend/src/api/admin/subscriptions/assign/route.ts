import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import SubscriptionService from "../../../../services/subscription"

/**
 * POST /admin/subscriptions/assign
 *
 * Manually assign a subscription plan to a seller.
 * Cancels any existing active subscription for that seller first.
 *
 * Request body:
 * {
 *   "seller_id": "seller_...",
 *   "plan_name": "Managed",
 *   "duration_days": 30   // optional, default 30
 * }
 *
 * Sample response (201):
 * {
 *   "subscription": {
 *     "id": "vsub_...",
 *     "seller_id": "seller_...",
 *     "plan_name": "Managed",
 *     "status": "active",
 *     ...
 *   }
 * }
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const { seller_id, plan_name, duration_days } = req.body as any

    if (!seller_id || typeof seller_id !== "string") {
      res.status(400).json({ message: "seller_id is required" })
      return
    }
    if (!plan_name || typeof plan_name !== "string") {
      res.status(400).json({ message: "plan_name is required" })
      return
    }

    const { is_trial } = req.body as any
    const service = new SubscriptionService(req.scope)
    const subscription = await service.adminAssign(
      seller_id,
      plan_name,
      duration_days ? Number(duration_days) : 30,
      Boolean(is_trial)
    )

    res.status(201).json({ subscription })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to assign subscription"
    const status = msg.includes("not found") ? 404 : 400
    res.status(status).json({ message: msg })
  }
}

/**
 * DELETE /admin/subscriptions/assign
 *
 * Deactivate (cancel) a specific subscription by ID.
 *
 * Request body: { "subscription_id": "vsub_..." }
 */
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const { subscription_id } = req.body as any

    if (!subscription_id) {
      res.status(400).json({ message: "subscription_id is required" })
      return
    }

    const service = new SubscriptionService(req.scope)
    const subscription = await service.adminDeactivate(subscription_id)

    res.status(200).json({ subscription, message: "Subscription deactivated" })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to deactivate subscription"
    const status = msg.includes("not found") ? 404 : 400
    res.status(status).json({ message: msg })
  }
}
