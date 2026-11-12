import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { listCodRemittances, recordCodStep } from "../../../lib/cod-remittance"

const STATES = ["with_courier", "to_pay_seller", "paid"]

/** GET /admin/cod-remittances?state=&seller_id=&provider= — COD cash by where it currently sits. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const q = req.query as Record<string, string>
  const limit = Number(q.limit) || 50
  const offset = Number(q.offset) || 0
  const result = await listCodRemittances(
    pg,
    { state: STATES.includes(q.state) ? q.state : undefined, seller_id: q.seller_id || undefined, provider: q.provider || undefined },
    limit,
    offset
  )
  res.json({ ...result, limit, offset })
}

/**
 * POST /admin/cod-remittances { ids: string[], step: "received" | "paid", reference: string }
 * Marks bookings as remitted by the courier, or as paid on to the seller.
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { ids, step, reference } = (req.body ?? {}) as { ids?: unknown; step?: string; reference?: unknown }
  if (!Array.isArray(ids) || !ids.length || ids.length > 500 || !ids.every((i) => typeof i === "string")) {
    return res.status(400).json({ message: "Choose at least one booking" })
  }
  if (step !== "received" && step !== "paid") {
    return res.status(400).json({ message: "step must be received or paid" })
  }
  if (typeof reference !== "string" || !reference.trim() || reference.length > 200) {
    return res.status(400).json({ message: "Add the bank or remittance reference" })
  }
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const updated = await recordCodStep(pg, ids as string[], step, reference.trim())
  res.json({ updated, skipped: ids.length - updated })
}
