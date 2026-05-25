import { type SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules, PaymentEvents } from "@medusajs/framework/utils"

/**
 * Resets COD payment status back to "authorized" after the mercurjs plugin
 * auto-captures pp_system_default payments on order placement.
 *
 * The @mercurjs/b2c-core subscriber `split-payment-payment-captured` fires on
 * every PaymentEvents.CAPTURED (including pp_system_default auto-captures) and
 * marks both the core `payment` record and `split_order_payment` as captured.
 * This subscriber runs 600ms later to undo that for COD orders — resetting both
 * tables so the vendor panel shows "Awaiting" until cash is physically collected.
 */
export default async function resetCodSplitPayment({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const paymentId = event.data.id
  if (!paymentId) return

  // Resolve the payment module to check the provider
  const paymentService = container.resolve(Modules.PAYMENT)
  const payment = await paymentService.retrievePayment(paymentId, {
    relations: ["payment_collection"],
  })

  // Only act on COD (system default) payments
  if (payment.provider_id !== "pp_system_default") return

  const paymentCollectionId = (payment as any).payment_collection_id
    ?? (payment as any).payment_collection?.id
  if (!paymentCollectionId) return

  // Wait for the mercurjs subscriber to finish writing its update first
  await new Promise<void>((resolve) => setTimeout(resolve, 600))

  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const now = new Date()

  // Reset the core payment record — this drives the "Captured" badge in the UI
  await pg("payment")
    .where({ id: paymentId })
    .update({
      status: "authorized",
      captured_amount: 0,
      raw_captured_amount: JSON.stringify({ value: "0", precision: 20 }),
      captured_at: null,
      updated_at: now,
    })

  // Reset the split order payment record
  await pg("split_order_payment")
    .where({ payment_collection_id: paymentCollectionId, status: "captured" })
    .whereNull("deleted_at")
    .update({
      captured_amount: 0,
      raw_captured_amount: JSON.stringify({ value: "0", precision: 20 }),
      status: "pending",
      updated_at: now,
    })
}

export const config: SubscriberConfig = {
  event: PaymentEvents.CAPTURED,
  context: {
    subscriberId: "reset-cod-split-payment-handler",
  },
}
