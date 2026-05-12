import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import SubscriptionService from "../../../../services/subscription"

/**
 * GET /admin/subscriptions/plans
 *
 * Returns all subscription plans (including inactive ones).
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const service = new SubscriptionService(req.scope)

    let pgConnection: any
    try {
      const { ContainerRegistrationKeys } = await import("@medusajs/framework/utils")
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch {
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    const plans = await pgConnection("subscription_plan").orderBy("price", "asc")
    res.status(200).json({ plans })
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch plans" })
  }
}

/**
 * PATCH /admin/subscriptions/plans
 *
 * Update an existing plan by ID.
 *
 * Request body: { "plan_id": "subplan_boost", "price": 1999, "status": "inactive" }
 */
export async function PATCH(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const { plan_id, ...updateData } = req.body as any

    if (!plan_id) {
      res.status(400).json({ message: "plan_id is required" })
      return
    }

    const service = new SubscriptionService(req.scope)
    const plan = await service.updatePlan(plan_id, updateData)

    res.status(200).json({ plan })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update plan"
    const status = msg.includes("not found") ? 404 : 400
    res.status(status).json({ message: msg })
  }
}
