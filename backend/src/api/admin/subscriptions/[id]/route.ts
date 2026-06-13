import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import SubscriptionService from "../../../../services/subscription"

/**
 * PATCH /admin/subscriptions/:id
 *
 * Manage a seller subscription status or trial period.
 *
 * Body variants:
 *   { "status": "active" | "cancelled" }
 *   { "action": "end_trial" }
 *   { "action": "extend_trial", "days": 7 }
 */
export async function PATCH(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const { id } = req.params as any
    const body = req.body as any
    const service = new SubscriptionService(req.scope)

    if (body.action === "end_trial") {
      const subscription = await service.adminEndTrial(id)
      res.status(200).json({ subscription })
      return
    }

    if (body.action === "extend_trial") {
      const days = Number(body.days)
      if (!days || days < 1) {
        res.status(400).json({ message: "days must be a positive integer" })
        return
      }
      const subscription = await service.adminExtendTrial(id, days)
      res.status(200).json({ subscription })
      return
    }

    const { status } = body
    if (!["active", "cancelled"].includes(status)) {
      res.status(400).json({ message: "status must be 'active' or 'cancelled'" })
      return
    }

    const subscription = await service.setStatus(id, status)
    res.status(200).json({ subscription })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update subscription"
    const status = msg.includes("not found") ? 404 : 400
    res.status(status).json({ message: msg })
  }
}
