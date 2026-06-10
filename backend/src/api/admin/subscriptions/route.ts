import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import SubscriptionService from "../../../services/subscription"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const { status, seller_id, limit, offset } = req.query as any

    const service = new SubscriptionService(req.scope)
    const result = await service.listAll({
      status: status || undefined,
      seller_id: seller_id || undefined,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    })

    // Enrich subscriptions with seller name + email
    let enriched = result.subscriptions
    try {
      const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
      const sellerIds = [...new Set(result.subscriptions.map((s: any) => s.seller_id))]
      if (sellerIds.length > 0) {
        const sellers = await db("seller").whereIn("id", sellerIds).select("id", "name", "email")
        const sellerMap: Record<string, { name: string; email: string }> = {}
        for (const s of sellers) sellerMap[s.id] = { name: s.name, email: s.email }
        enriched = result.subscriptions.map((sub: any) => ({
          ...sub,
          seller_name: sellerMap[sub.seller_id]?.name || null,
          seller_email: sellerMap[sub.seller_id]?.email || null,
        }))
      }
    } catch {
      // seller join is best-effort
    }

    res.status(200).json({
      subscriptions: enriched,
      count: result.count,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    })
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to list subscriptions" })
  }
}

/**
 * POST /admin/subscriptions
 *
 * Create a new subscription plan.
 *
 * Request body:
 * {
 *   "name": "Enterprise",
 *   "price": 9999,
 *   "features": { "max_products": -1, "priority_support": true }
 * }
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const { name, price, features } = req.body as any

    if (!name || typeof name !== "string") {
      res.status(400).json({ message: "name is required" })
      return
    }
    if (price === undefined || isNaN(Number(price))) {
      res.status(400).json({ message: "price must be a number" })
      return
    }

    const service = new SubscriptionService(req.scope)
    const plan = await service.createPlan({ name, price: Number(price), features })

    res.status(201).json({ plan })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create plan"
    const status = msg.includes("already exists") ? 409 : 400
    res.status(status).json({ message: msg })
  }
}
