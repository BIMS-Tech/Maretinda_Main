import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/subscription/verify-payment?ref=<reference_number>
 *
 * Public endpoint — verifies that a GiyaPay reference number:
 *   1. Exists in giyapay_transaction with status SUCCESS
 *   2. Was for a vendor subscription order (order_id starts with "vsub_")
 *   3. Has NOT already been used (vendor_id is still null)
 *
 * Used by the store's /become-vendor/register page to gate access to the signup form.
 *
 * Sample response (valid):
 * { "valid": true, "plan_name": "Foundation", "amount": 999 }
 *
 * Sample response (invalid):
 * { "valid": false, "reason": "Payment not found or already used" }
 */
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const { ref } = req.query as any

    if (!ref || typeof ref !== "string") {
      res.status(400).json({ valid: false, reason: "ref parameter is required" })
      return
    }

    let pgConnection: any
    try {
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch {
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    const txn = await pgConnection("giyapay_transaction")
      .where("reference_number", ref)
      .first()

    if (!txn) {
      res.status(200).json({ valid: false, reason: "Payment reference not found" })
      return
    }

    if (txn.status !== "SUCCESS") {
      res.status(200).json({ valid: false, reason: "Payment was not successful" })
      return
    }

    // Must be a subscription payment
    if (!txn.order_id || !String(txn.order_id).startsWith("vsub_")) {
      res.status(200).json({ valid: false, reason: "Not a vendor subscription payment" })
      return
    }

    // Must not already be claimed
    if (txn.vendor_id) {
      res.status(200).json({ valid: false, reason: "This payment has already been used to create a vendor account" })
      return
    }

    // Extract plan slug from order_id: vsub_<slug>_<timestamp>
    const parts = String(txn.order_id).split("_")
    // parts: ["vsub", "foundation", "1745..."]  or  ["vsub", "boost", "1745..."]
    const planSlug = parts.slice(1, parts.length - 1).join("_") // handles multi-word plan names

    // Look up plan by slug (name converted to slug)
    const plans = await pgConnection("subscription_plan").where("status", "active")
    const plan = plans.find(
      (p: any) => p.name.toLowerCase().replace(/\s+/g, "_") === planSlug
    )

    res.status(200).json({
      valid: true,
      plan_name: plan?.name || planSlug,
      plan_id: plan?.id || null,
      amount: txn.amount,
      reference_number: txn.reference_number,
      order_id: txn.order_id,
    })
  } catch (error) {
    console.error("[VerifyPayment] Error:", error)
    res.status(500).json({ valid: false, reason: "Server error during verification" })
  }
}
