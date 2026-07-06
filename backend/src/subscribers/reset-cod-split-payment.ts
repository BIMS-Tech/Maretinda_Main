import { type SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules, PaymentEvents } from "@medusajs/framework/utils"
import { resetCodPaymentToAuthorized } from "../lib/cod-payment"

/**
 * Resets COD payment status back to "authorized" after the mercurjs plugin
 * auto-captures pp_system_default payments on order placement.
 *
 * The @mercurjs/b2c-core subscriber `order-set-placed-payment-capture` runs
 * capturePaymentWorkflow on EVERY order (COD included), which sets
 * payment_collection.captured_amount + status = completed and emits
 * PaymentEvents.CAPTURED. This subscriber reverses that for COD orders so the
 * order shows "Authorized" (awaiting cash) until the seller physically collects
 * it. See resetCodPaymentToAuthorized for which tables actually drive the badge.
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

  // Wait for the mercurjs subscriber to finish writing split_order_payment first
  await new Promise<void>((resolve) => setTimeout(resolve, 600))

  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  await resetCodPaymentToAuthorized(pg, { paymentCollectionId, paymentId })
}

export const config: SubscriberConfig = {
  event: PaymentEvents.CAPTURED,
  context: {
    subscriberId: "reset-cod-split-payment-handler",
  },
}
