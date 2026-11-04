import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/giyapay/transaction?order_id=…
 *
 * Public lookup behind the order confirmation page, which only needs how the
 * order was paid. Keep the response to that: this answers anyone holding an id,
 * so it must not include the gateway's signature, nonce or other raw payment data.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query: any = req.query || {}
    const reference = query.reference_number || query.refno || query.reference || query.ref
    const orderId = query.order_id || query.orderId

    if ((!reference && !orderId) || [reference, orderId].some((v) => v !== undefined && typeof v !== "string")) {
      return res.status(400).json({ error: "order_id or reference_number is required" })
    }

    const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

    // Individual order ids (order_01…) are recorded against their order set.
    let orderSetId: string | null = null
    if (orderId?.startsWith("order_")) {
      const link = await db("order_set_order")
        .where("order_id", orderId)
        .first()
        .catch(() => null)
      orderSetId = link?.order_set_id ?? null
    }

    const transaction = await db("giyapay_transaction")
      .where((qb: any) => {
        if (reference) qb.orWhere("reference_number", reference)
        if (orderId) qb.orWhere("order_id", orderId).orWhere("cart_id", orderId)
        if (orderSetId) qb.orWhere("order_id", orderSetId)
      })
      .orderBy("created_at", "desc")
      .first()
      .catch(() => null)

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" })
    }

    return res.json({
      referenceNumber: transaction.reference_number,
      orderId: transaction.order_id,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      gateway: transaction.gateway,
      createdAt: transaction.created_at,
    })
  } catch (error: any) {
    console.error("[GiyaPay Store Transaction] Error:", error)
    return res.status(500).json({ error: "Failed to fetch transaction" })
  }
}
