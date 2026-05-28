import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /vendor/subscription/plans
 *
 * Returns all active subscription plans. Requires vendor JWT auth.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    let pgConnection: any
    try {
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch {
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    const plans = await pgConnection("subscription_plan")
      .where("status", "active")
      .orderBy("price", "asc")

    res.status(200).json({ plans })
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch plans" })
  }
}
