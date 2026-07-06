import { generateEntityId } from "@medusajs/framework/utils"

/**
 * Helpers for COD (pp_system_default) capture state.
 *
 * IMPORTANT: the order-list "Payment" badge is derived by Medusa from
 * `payment_collection.captured_amount` + `payment_collection.status`
 * (see @medusajs/core-flows getLastPaymentStatus / aggregate-status), NOT from
 * the `payment` row or the mercur `split_order_payment` table. The `payment`
 * table has no `status` / `captured_amount` columns at all — its capture state
 * lives in `payment.captured_at` plus rows in the `capture` table.
 *
 * So to correctly flip a COD order between "Captured" and "Authorized" we must
 * touch four things: payment_collection (drives the badge), payment.captured_at,
 * the capture record, and split_order_payment (the seller split view).
 *
 * These writes are done directly (not via capturePaymentWorkflow) so they do NOT
 * emit PaymentEvents.CAPTURED — which would re-trigger the reset subscriber.
 */

const zeroRaw = () => JSON.stringify({ value: "0", precision: 20 })

const normalizeRaw = (rawAmount: unknown, amount: number): string =>
  typeof rawAmount === "string"
    ? rawAmount
    : JSON.stringify(rawAmount ?? { value: String(amount), precision: 20 })

/**
 * Reverse an auto-capture on a COD payment so the order reads as "Authorized"
 * (awaiting cash) instead of "Captured".
 */
export async function resetCodPaymentToAuthorized(
  pg: any,
  { paymentCollectionId, paymentId }: { paymentCollectionId: string; paymentId: string }
) {
  const now = new Date()

  // 1. payment_collection — this is what the order payment badge reads
  await pg("payment_collection")
    .where({ id: paymentCollectionId })
    .update({
      status: "authorized",
      captured_amount: 0,
      raw_captured_amount: zeroRaw(),
      completed_at: null,
      updated_at: now,
    })

  // 2. clear the capture timestamp on the payment row
  await pg("payment")
    .where({ id: paymentId })
    .update({ captured_at: null, updated_at: now })

  // 3. soft-delete the capture record(s) so nothing recomputes a captured amount
  await pg("capture")
    .where({ payment_id: paymentId })
    .whereNull("deleted_at")
    .update({ deleted_at: now, updated_at: now })

  // 4. reset the mercur split_order_payment (seller split view)
  await pg("split_order_payment")
    .where({ payment_collection_id: paymentCollectionId })
    .whereNull("deleted_at")
    .update({
      status: "pending",
      captured_amount: 0,
      raw_captured_amount: zeroRaw(),
      updated_at: now,
    })
}

/**
 * Mark a COD payment as captured (seller confirmed cash received).
 */
export async function captureCodPayment(
  pg: any,
  {
    paymentCollectionId,
    paymentId,
    amount,
    rawAmount,
  }: { paymentCollectionId: string; paymentId: string; amount: number; rawAmount?: unknown }
) {
  const now = new Date()
  const rawCaptured = normalizeRaw(rawAmount, amount)

  // 1. payment_collection — drives the order payment badge
  await pg("payment_collection")
    .where({ id: paymentCollectionId })
    .update({
      status: "completed",
      captured_amount: amount,
      raw_captured_amount: rawCaptured,
      completed_at: now,
      updated_at: now,
    })

  // 2. stamp the payment row
  await pg("payment")
    .where({ id: paymentId })
    .update({ captured_at: now, updated_at: now })

  // 3. record the capture (unless a live one already exists)
  const existing = await pg("capture")
    .where({ payment_id: paymentId })
    .whereNull("deleted_at")
    .first()
  if (!existing) {
    await pg("capture").insert({
      id: generateEntityId("", "capt"),
      payment_id: paymentId,
      amount,
      raw_amount: rawCaptured,
      created_at: now,
      updated_at: now,
    })
  }

  // 4. mark the mercur split_order_payment captured (seller split view)
  await pg("split_order_payment")
    .where({ payment_collection_id: paymentCollectionId })
    .whereNull("deleted_at")
    .update({
      status: "captured",
      captured_amount: amount,
      raw_captured_amount: rawCaptured,
      updated_at: now,
    })
}
