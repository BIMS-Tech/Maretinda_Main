import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sellerIdOfMember } from "../../../lib/seller-ownership"
import { listStock, parseStockUpdates, saveStock, StockFilter } from "../../../lib/seller-stock"

const FILTERS: StockFilter[] = ["all", "unset", "low", "out"]

const sellerId = (req: AuthenticatedMedusaRequest) =>
  sellerIdOfMember(req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION), req.auth_context?.actor_id)

/** GET /vendor/stock?q=&product_id=&filter=all|unset|low|out — the shop's stock, one row per variant. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const id = await sellerId(req)
  if (!id) return res.status(401).json({ message: "Unauthorized" })
  const filter = FILTERS.includes(req.query.filter as StockFilter) ? (req.query.filter as StockFilter) : "all"
  res.json(
    await listStock(req.scope, id, {
      q: String(req.query.q ?? ""),
      productId: req.query.product_id ? String(req.query.product_id) : undefined,
      filter,
      limit: Number(req.query.limit) || 50,
      offset: Number(req.query.offset) || 0,
    })
  )
}

/** POST /vendor/stock  { updates: [{ variant_id, quantity }] } — how many are on hand now. */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const id = await sellerId(req)
  if (!id) return res.status(401).json({ message: "Unauthorized" })
  const updates = parseStockUpdates(req.body)
  if (typeof updates === "string") return res.status(400).json({ type: "invalid_data", message: updates })
  const result = await saveStock(req.scope, id, updates)
  if ("error" in result) return res.status(400).json({ type: "not_allowed", message: result.error })
  res.json(result)
}
