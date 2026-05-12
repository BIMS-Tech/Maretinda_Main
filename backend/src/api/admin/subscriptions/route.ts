import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import SubscriptionService from "../../../services/subscription"

/**
 * GET /admin/subscriptions
 *
 * List all vendor subscriptions with optional filters.
 *
 * Query params: status, vendor_id, limit, offset
 *
 * Sample response:
 * {
 *   "subscriptions": [...],
 *   "count": 42,
 *   "limit": 50,
 *   "offset": 0
 * }
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const { status, vendor_id, limit, offset } = req.query as any

    const service = new SubscriptionService(req.scope)
    const result = await service.listAll({
      status: status || undefined,
      vendor_id: vendor_id || undefined,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    })

    res.status(200).json({
      ...result,
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
