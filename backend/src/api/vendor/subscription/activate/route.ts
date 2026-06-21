import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import crypto from "crypto"
import SubscriptionService from "../../../../services/subscription"

function getsellerPanelUrl(): string {
  // Must resolve identically to the checkout route's success_callback — the
  // GiyaPay redirect signature is computed over this exact URL.
  return (
    process.env.SELLER_PANEL_URL ||
    process.env.SELLER_CORS?.split(",")[0] ||
    process.env.VENDOR_CORS?.split(",")[0] ||
    "http://localhost:5173"
  ).replace(/\/$/, "")
}

async function getMerchantSecret(scope: any): Promise<string | null> {
  try {
    const db = scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const subConfig = await db("giyapay_subscription_config")
      .where("is_enabled", true)
      .select("merchant_secret")
      .first()
    if (subConfig?.merchant_secret) return subConfig.merchant_secret
  } catch {
    // table may not exist yet
  }

  try {
    let giyaPayService: any
    try {
      giyaPayService = scope.resolve("giyaPayService")
    } catch {
      const GiyaPayService = (await import("../../../../services/giyapay.js")).default as any
      giyaPayService = new GiyaPayService(scope)
    }
    const config = await giyaPayService.getConfig()
    return config?.merchantSecret || null
  } catch {
    return null
  }
}

/**
 * POST /seller/subscription/activate
 *
 * Called by the seller panel after GiyaPay redirects back on payment success.
 * Verifies the GiyaPay signature, then creates an active seller_subscription.
 *
 * Body: { order_id, refno, nonce, timestamp, amount, signature }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const memberId = (req as any).auth_context?.actor_id || (req as any).user?.id
    if (!memberId) {
      res.status(401).json({ message: "Unauthorized" })
      return
    }

    const { order_id, refno, nonce, timestamp, amount, signature } = req.body as any

    console.log("[Subscription Activate] Received:", JSON.stringify({
      order_id, refno, nonce, timestamp, amount, hasSignature: !!signature,
    }))

    if (!order_id || !refno || !nonce || !timestamp || !amount || !signature) {
      console.warn("[Subscription Activate] Missing params — order_id:", order_id)
      res.status(400).json({ message: "Missing required payment parameters" })
      return
    }

    if (!String(order_id).startsWith("vrenew_")) {
      res.status(400).json({ message: "Invalid order type for subscription activation" })
      return
    }

    let pgConnection: any
    try {
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch {
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    // Resolve seller_id from member
    const member = await pgConnection("member").where("id", memberId).first()
    if (!member?.seller_id) {
      res.status(403).json({ message: "Not a seller" })
      return
    }
    const sellerId = member.seller_id

    // Get merchant secret
    const merchantSecret = await getMerchantSecret(req.scope)
    if (!merchantSecret) {
      res.status(503).json({ message: "Payment gateway not configured. Contact support." })
      return
    }

    // Verify GiyaPay signature:
    // sha512("{sellerPanelUrl}/subscription?nonce={nonce}&order_id={order_id}&refno={refno}&timestamp={timestamp}&amount={amount}" + merchantSecret)
    const successCallbackUrl = `${getsellerPanelUrl()}/subscription`
    const urlWithoutSignature = `${successCallbackUrl}?nonce=${nonce}&order_id=${order_id}&refno=${refno}&timestamp=${timestamp}&amount=${amount}`
    const expectedSignature = crypto.createHash("sha512").update(urlWithoutSignature + merchantSecret).digest("hex")

    if (signature !== expectedSignature) {
      console.error("[Subscription Activate] Signature mismatch for order:", order_id)
      res.status(400).json({ message: "Payment verification failed — invalid signature" })
      return
    }

    // Idempotency: if already activated by this payment reference, return the existing subscription
    const existingByRef = await pgConnection("seller_subscription")
      .where("payment_reference", refno)
      .first()
    if (existingByRef) {
      const plan = await pgConnection("subscription_plan").where("name", existingByRef.plan_name).first()
      res.status(200).json({ success: true, subscription: existingByRef, plan, already_activated: true })
      return
    }

    // Parse order_id: vrenew_{planSlug}_{billing}_{sellerId}_{timestamp}
    // planSlug has no underscores (Foundation/Boost/Managed are single words)
    const match = String(order_id).match(/^vrenew_([^_]+)_(monthly|yearly)_(.+)_(\d{10,})$/)
    if (!match) {
      res.status(400).json({ message: "Could not parse order ID" })
      return
    }
    const [, planSlug, billingPeriod, ordersellerId] = match

    if (ordersellerId !== sellerId) {
      res.status(403).json({ message: "Order does not belong to this seller" })
      return
    }

    // Resolve plan — try by ID first, then by name
    const plan = await pgConnection("subscription_plan")
      .where(function (this: any) {
        this.where("id", `subplan_${planSlug}`)
          .orWhereRaw("LOWER(REPLACE(name, ' ', '_')) = ?", [planSlug])
      })
      .first()

    if (!plan) {
      res.status(404).json({ message: `Plan "${planSlug}" not found` })
      return
    }

    const price = billingPeriod === "yearly"
      ? (plan.yearly_price ?? Math.round(plan.price * 10))
      : plan.price

    const subscriptionService = new SubscriptionService(req.scope)
    const subscription = await subscriptionService.renewSubscription({
      sellerId,
      planName: plan.name,
      billingPeriod: billingPeriod as "monthly" | "yearly",
      price,
      paymentReference: refno,
      planId: plan.id,
    })

    console.log(`[Subscription Activate] Activated ${plan.name} (${billingPeriod}) for seller ${sellerId}, ref: ${refno}`)

    res.status(200).json({ success: true, subscription, plan })
  } catch (error) {
    console.error("[Subscription Activate] Error:", error)
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to activate subscription" })
  }
}
