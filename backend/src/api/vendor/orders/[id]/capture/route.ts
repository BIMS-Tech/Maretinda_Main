import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { captureCodPayment } from "../../../../../lib/cod-payment"

/**
 * POST /seller/orders/:id/capture
 *
 * seller-initiated manual capture for COD (pp_system_default) orders.
 * Writes the capture state directly via Knex (see captureCodPayment) to avoid
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

  await captureCodPayment(pg, {
    paymentCollectionId: payment.payment_collection_id,
    paymentId: payment.id,
    amount: payment.amount,
    rawAmount: payment.raw_amount,
  })

  return res.status(200).json({ message: "Payment captured successfully", payment_id: payment.id })
}
