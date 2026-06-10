import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import SubscriptionService from "../../../../services/subscription"

/**
 * GET /seller/subscription/status
 *
 * Returns the current seller subscription record.
 * Billing and renewal are managed by GiyaPay — this is read-only status.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const memberId = (req as any).auth_context?.actor_id || (req as any).user?.id
    if (!memberId) {
      res.status(401).json({ message: "Unauthorized" })
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
    const status = await service.getSubscriptionStatus(member.seller_id)

    res.status(200).json(status)
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch subscription status" })
  }
}
