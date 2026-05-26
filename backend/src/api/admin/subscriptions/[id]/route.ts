import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import SubscriptionService from "../../../../services/subscription"

/**
 * PATCH /admin/subscriptions/:id
 *
 * Activate or deactivate a specific vendor subscription.
 * Body: { "status": "active" | "cancelled" }
 */
export async function PATCH(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const { id } = req.params as any
    const { status } = req.body as any

    if (!["active", "cancelled"].includes(status)) {
      res.status(400).json({ message: "status must be 'active' or 'cancelled'" })
      return
    }

    const service = new SubscriptionService(req.scope)
    const subscription = await service.setStatus(id, status)

    res.status(200).json({ subscription })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update subscription"
    res.status(msg.includes("not found") ? 404 : 400).json({ message: msg })
  }
}
