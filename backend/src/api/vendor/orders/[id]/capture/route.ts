import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * POST /vendor/orders/:id/capture
 *
 * Vendor-initiated manual capture for COD (pp_system_default) orders.
 * Updates payment and split_order_payment directly via Knex to avoid
 * triggering PaymentEvents.CAPTURED, which would fire the reset subscriber
 * and undo the capture.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const orderId = req.params.id
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  // Find the COD payment for this order
  const result = await pg.raw(
    `SELECT p.id, p.amount, p.raw_amount, p.currency_code, pc.id AS payment_collection_id
     FROM payment p
     JOIN payment_collection pc ON pc.id = p.payment_collection_id
     JOIN order_payment_collection opc ON opc.payment_collection_id = pc.id
     WHERE opc.order_id = ?
       AND p.provider_id = 'pp_system_default'
       AND p.deleted_at IS NULL
       AND pc.deleted_at IS NULL
     LIMIT 1`,
    [orderId]
  )

  const payment = result?.rows?.[0]
  if (!payment) {
    return res.status(404).json({ message: "No COD payment found for this order" })
  }

  const now = new Date()
  const amount = payment.amount
  // raw_amount stores the full precision value; use it for captured amount
  const rawCapturedAmount = payment.raw_amount ?? JSON.stringify({ value: String(amount), precision: 20 })

  await pg("payment").where({ id: payment.id }).update({
    status: "captured",
    captured_amount: amount,
    raw_captured_amount: rawCapturedAmount,
    captured_at: now,
    updated_at: now,
  })

  await pg("split_order_payment")
    .where({ payment_collection_id: payment.payment_collection_id })
    .whereNull("deleted_at")
    .update({
      status: "captured",
      captured_amount: amount,
      raw_captured_amount: rawCapturedAmount,
      updated_at: now,
    })

  return res.status(200).json({ message: "Payment captured successfully", payment_id: payment.id })
}
