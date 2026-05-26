import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import SubscriptionService from "../../../../services/subscription"

/**
 * POST /store/subscription/activate-renewal
 *
 * Public endpoint called by the store's GiyaPay success page after a vendor
 * renewal payment completes.  It decodes the vendor_id from the order_id,
 * validates the GiyaPay transaction and activates the subscription.
 *
 * Request body:
 * { "reference_number": "GYP-...", "order_id": "vrenew_boost_monthly_seller_xxx_1746..." }
 *
 * The order_id format is:  vrenew_<planSlug>_<period>_<vendorId>_<timestamp>
 * where vendorId is the seller id (e.g. "seller_01abc...")
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const { reference_number, order_id } = req.body as any

    if (!reference_number || !order_id) {
      res.status(400).json({ success: false, message: "reference_number and order_id are required" })
      return
    }

    if (!String(order_id).startsWith("vrenew_")) {
      res.status(400).json({ success: false, message: "Not a vendor renewal payment" })
      return
    }

    let pgConnection: any
    try {
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch {
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    // Verify GiyaPay transaction
    const txn = await pgConnection("giyapay_transaction")
      .where("reference_number", reference_number)
      .first()

    if (!txn) {
      res.status(404).json({ success: false, message: "Payment reference not found" })
      return
    }
    if (txn.status !== "SUCCESS") {
      res.status(400).json({ success: false, message: "Payment was not successful" })
      return
    }
    if (txn.order_id !== order_id) {
      res.status(400).json({ success: false, message: "Order ID mismatch" })
      return
    }

    // Parse order_id: vrenew_<planSlug>_<period>_<vendorId>_<timestamp>
    // vendorId contains underscores (e.g. "seller_01abc") so we parse from the right
    const withoutPrefix = order_id.replace(/^vrenew_/, "")
    // Remove trailing timestamp (last segment after final underscore that is numeric)
    const tsMatch = withoutPrefix.match(/_(\d{13,})$/)
    if (!tsMatch) {
      res.status(400).json({ success: false, message: "Invalid order_id format" })
      return
    }
    const withoutTs = withoutPrefix.slice(0, withoutPrefix.lastIndexOf(`_${tsMatch[1]}`))

    // Remaining: <planSlug>_<period>_<vendorId>
    // period is always "monthly" or "yearly"
    const periodMatch = withoutTs.match(/_(monthly|yearly)_(.+)$/)
    if (!periodMatch) {
      res.status(400).json({ success: false, message: "Cannot parse billing period from order_id" })
      return
    }
    const billingPeriod = periodMatch[1] as "monthly" | "yearly"
    const vendorId = periodMatch[2]
    const planSlug = withoutTs.slice(0, withoutTs.lastIndexOf(`_${billingPeriod}_`))

    // Look up the plan by slug
    const plans = await pgConnection("subscription_plan").where("status", "active")
    const plan = plans.find(
      (p: any) => p.name.toLowerCase().replace(/\s+/g, "_") === planSlug
    )

    if (!plan) {
      res.status(404).json({ success: false, message: `Plan "${planSlug}" not found` })
      return
    }

    const price = billingPeriod === "yearly"
      ? (plan.yearly_price ?? plan.price * 10)
      : plan.price

    // Activate subscription
    const service = new SubscriptionService(req.scope)
    const subscription = await service.renewSubscription({
      vendorId,
      planName: plan.name,
      planId: plan.id,
      billingPeriod,
      price,
      paymentReference: reference_number,
    })

    // Mark transaction as claimed
    await pgConnection("giyapay_transaction")
      .where("reference_number", reference_number)
      .update({ vendor_id: vendorId, updated_at: new Date() })

    res.status(200).json({
      success: true,
      subscription,
      message: "Subscription activated successfully",
    })
  } catch (error) {
    console.error("[ActivateRenewal] Error:", error)
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Server error" })
  }
}
