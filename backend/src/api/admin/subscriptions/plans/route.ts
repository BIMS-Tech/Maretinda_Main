import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import SubscriptionService from "../../../../services/subscription"

/**
 * GET /admin/subscriptions/plans - returns all subscription plans including inactive ones
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    let pgConnection: any
    try {
      const { ContainerRegistrationKeys } = await import("@medusajs/framework/utils")
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch {
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    const plans = await pgConnection("subscription_plan").orderBy("price", "asc")
    res.json({ plans })
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch plans" })
  }
}

/**
 * PATCH /admin/subscriptions/plans
 *
 * Update an existing plan.
 * Body: {
 *   "plan_id": "subplan_boost",
 *   "price": 1499,
 *   "yearly_price": 14990,
 *   "yearly_discount_percent": 17,
 *   "trial_days": 7,
 *   "status": "active"
 * }
 */
export async function PATCH(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const { plan_id, ...updateData } = req.body as any

    if (!plan_id) {
      res.status(400).json({ message: "plan_id is required" })
      return
    }

    // If discount_percent is provided but yearly_price is not, compute yearly_price
    if (updateData.yearly_discount_percent !== undefined && updateData.yearly_price === undefined && updateData.price !== undefined) {
      const discount = Number(updateData.yearly_discount_percent)
      const monthly = Number(updateData.price)
      updateData.yearly_price = Math.round(monthly * 12 * (1 - discount / 100))
    }

    // If yearly_price is set directly but no discount_percent, compute implicit discount
    if (updateData.yearly_price !== undefined && updateData.yearly_discount_percent === undefined && updateData.price !== undefined) {
      const annual = Number(updateData.yearly_price)
      const monthly = Number(updateData.price)
      const fullAnnual = monthly * 12
      if (fullAnnual > 0) {
        updateData.yearly_discount_percent = Math.round((1 - annual / fullAnnual) * 100)
      }
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
