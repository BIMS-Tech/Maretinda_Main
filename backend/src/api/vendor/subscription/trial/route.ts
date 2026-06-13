import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import SubscriptionService from "../../../../services/subscription"

/**
 * POST /vendor/subscription/trial
 *
 * Starts a free trial for a first-time seller.
 * Body: { "plan_name": "Growth" }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const memberId = (req as any).auth_context?.actor_id || (req as any).user?.id
    if (!memberId) {
      res.status(401).json({ message: "Unauthorized" })
      return
    }

    const { plan_name } = req.body as any
    if (!plan_name || typeof plan_name !== "string") {
      res.status(400).json({ message: "plan_name is required" })
      return
    }

    let pgConnection: any
    try {
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch {
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    const member = await pgConnection("member").where("id", memberId).first()
    if (!member?.seller_id) {
      res.status(403).json({ message: "Not a seller" })
      return
    }

    const service = new SubscriptionService(req.scope)
    const subscription = await service.startTrial(member.seller_id, plan_name)

    res.status(200).json({ success: true, subscription })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to start trial"
    const status = msg.includes("already been used") ? 409 : msg.includes("not found") ? 404 : 400
    res.status(status).json({ message: msg })
  }
}
