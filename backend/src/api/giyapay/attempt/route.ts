import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { recordAttempt } from "../../../lib/giyapay-attempts"

/**
 * POST /giyapay/attempt { cart_id, method }
 * The storefront calls this as it sends the buyer to GiyaPay. It only notes
 * that a payment was started; it can't mark anything paid.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { cart_id, method } = (req.body ?? {}) as { cart_id?: unknown; method?: unknown }
  if (typeof cart_id !== "string" || !cart_id || cart_id.length > 100) {
    return res.status(400).json({ success: false, message: "Missing cart_id" })
  }
  try {
    const recorded = await recordAttempt(req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION), cart_id, typeof method === "string" ? method : undefined)
    res.status(200).json({ success: recorded })
  } catch (error) {
    console.error("[GiyaPay Attempt]", error)
    res.status(200).json({ success: false })
  }
}
