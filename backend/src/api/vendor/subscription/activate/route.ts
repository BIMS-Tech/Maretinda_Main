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

    // NOTE: GiyaPay does not round-trip our order_id (it returns "undefined")
    // or our nonce (it sends a different one). So we cannot validate the order
    // type from order_id. We pass order_id through purely for signature
    // verification (GiyaPay signed the callback URL containing order_id=undefined).
    if (!refno || !nonce || !timestamp || !amount || !signature) {
      console.warn("[Subscription Activate] Missing params — refno:", refno)
      res.status(400).json({ message: "Missing required payment parameters" })
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

    // Recover the plan/period from the pending intent stored at checkout, keyed
    // by the authenticated seller (order_id/nonce don't survive the GiyaPay
    // round-trip). The table is created by the checkout route.
    let intent: any = null
    try {
      intent = await pgConnection("subscription_payment_intent").where("seller_id", sellerId).first()
    } catch {
      // table doesn't exist yet → no intent
    }
    if (!intent) {
      console.warn("[Subscription Activate] No pending intent for seller:", sellerId)
      res.status(404).json({ message: "No pending subscription payment found for this account. Please start the checkout again." })
      return
    }

    const billingPeriod = (intent.billing_period === "yearly" ? "yearly" : "monthly") as "monthly" | "yearly"

    const plan = await pgConnection("subscription_plan")
      .where(function (this: any) {
        this.where("id", intent.plan_id).orWhere("name", intent.plan_name)
      })
      .first()

    if (!plan) {
      res.status(404).json({ message: `Plan "${intent.plan_name}" not found` })
      return
    }

    const price = Number(intent.price)

    const subscriptionService = new SubscriptionService(req.scope)
    const subscription = await subscriptionService.renewSubscription({
      sellerId,
      planName: plan.name,
      billingPeriod,
      price,
      paymentReference: refno,
      planId: plan.id,
    })

    // Consume the intent so it can't be replayed.
    try {
      await pgConnection("subscription_payment_intent").where("seller_id", sellerId).del()
    } catch { /* non-fatal */ }

    console.log(`[Subscription Activate] Activated ${plan.name} (${billingPeriod}) for seller ${sellerId}, ref: ${refno}`)

    res.status(200).json({ success: true, subscription, plan })
  } catch (error) {
    console.error("[Subscription Activate] Error:", error)
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to activate subscription" })
  }
}
