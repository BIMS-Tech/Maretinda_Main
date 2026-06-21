import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import crypto from "crypto"

/**
 * POST /seller/subscription/checkout
 *
 * Authenticated seller endpoint — generates GiyaPay form data so the seller
 * can renew or upgrade their subscription from the seller panel.
 *
 * Request body:
 * { "plan_name": "Boost", "billing_period": "monthly" | "yearly" }
 *
 * Response:
 * { "checkout_url": "https://...", "form_data": {...}, "enabled_methods": [...], "plan": {...} }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const memberId = (req as any).auth_context?.actor_id || (req as any).user?.id
    if (!memberId) {
      res.status(401).json({ message: "Unauthorized" })
      return
    }

    const { plan_name, billing_period = "monthly" } = req.body as any

    if (!plan_name || typeof plan_name !== "string") {
      res.status(400).json({ message: "plan_name is required" })
      return
    }
    if (!["monthly", "yearly"].includes(billing_period)) {
      res.status(400).json({ message: "billing_period must be 'monthly' or 'yearly'" })
      return
    }

    let pgConnection: any
    try {
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch {
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    // Resolve seller's seller_id
    const member = await pgConnection("member").where("id", memberId).first()
    if (!member?.seller_id) {
      res.status(403).json({ message: "Not a seller" })
      return
    }
    const sellerId = member.seller_id

    // Validate plan
    const plan = await pgConnection("subscription_plan")
      .where("name", plan_name)
      .where("status", "active")
      .first()

    if (!plan) {
      res.status(404).json({ message: `Plan "${plan_name}" not found` })
      return
    }

    const price = billing_period === "yearly" ? (plan.yearly_price ?? plan.price * 10) : plan.price
    const amountCentavos = Math.round(price * 100).toString()

    // Load subscription-specific GiyaPay config, fallback to main config
    let config: any = null
    try {
      const subConfig = await pgConnection("giyapay_subscription_config").first()
      if (subConfig?.is_enabled && subConfig.merchant_id && subConfig.merchant_secret) {
        config = {
          merchantId: subConfig.merchant_id,
          merchantSecret: subConfig.merchant_secret,
          sandboxMode: subConfig.sandbox_mode,
          enabledMethods: ["GCASH", "INSTAPAY", "MASTERCARD/VISA"],
        }
      }
    } catch {
      // table may not exist yet if migration hasn't run
    }

    if (!config) {
      // Fall back to main GiyaPay config
      let giyaPayService: any
      try {
        giyaPayService = req.scope.resolve("giyaPayService")
      } catch {
        const GiyaPayService = (await import("../../../../services/giyapay.js")).default as any
        giyaPayService = new GiyaPayService(req.scope)
      }
      const mainConfig = await giyaPayService.getConfig()
      if (!mainConfig?.merchantId || !mainConfig?.merchantSecret) {
        res.status(503).json({ message: "Payment gateway not configured. Contact support." })
        return
      }
      config = mainConfig
    }

    const planSlug = plan_name.toLowerCase().replace(/\s+/g, "_")
    const orderId = `vrenew_${planSlug}_${billing_period}_${sellerId}_${Date.now()}`

    const nonce = crypto.randomBytes(16).toString("hex")
    const timestamp = Math.floor(Date.now() / 1000).toString()

    const signatureString = `${config.merchantId}${amountCentavos}PHP${orderId}${timestamp}${nonce}${config.merchantSecret}`
    const signature = crypto.createHash("sha512").update(signatureString).digest("hex")

    const sellerPanelUrl = (
      process.env.SELLER_PANEL_URL ||
      process.env.SELLER_CORS?.split(",")[0] ||
      process.env.VENDOR_CORS?.split(",")[0] ||
      "http://localhost:5173"
    ).replace(/\/$/, "")

    // Success must redirect to the storefront's /giyapay/success page — that is
    // the ONLY callback URL the canonical /giyapay/verify endpoint reconstructs
    // when checking the GiyaPay signature. The success page verifies the payment,
    // records the transaction, activates the renewal, then bounces the seller
    // back to the seller panel (`/subscription?renewed=1`).
    // (Resolved identically to the verify route so the signed URL matches.)
    const storefrontUrl = (
      process.env.STOREFRONT_URL ||
      process.env.STORE_CORS?.split(",")[0] ||
      "http://localhost:3000"
    ).replace(/\/$/, "")

    const checkoutUrl = config.sandboxMode
      ? "https://sandbox.giyapay.com/checkout"
      : "https://pay.giyapay.com/checkout"

    const formData = {
      merchant_id: config.merchantId,
      order_id: orderId,
      amount: amountCentavos,
      currency: "PHP",
      description: `Maretinda seller Subscription - ${plan.name} Plan (${billing_period})`,
      nonce,
      timestamp,
      signature,
      success_callback: `${storefrontUrl}/giyapay/success`,
      error_callback: `${sellerPanelUrl}/subscription#payment-error`,
      cancel_callback: `${sellerPanelUrl}/subscription#payment-cancelled`,
    }

    res.status(200).json({
      checkout_url: checkoutUrl,
      form_data: formData,
      enabled_methods: config.enabledMethods || ["GCASH", "INSTAPAY", "MASTERCARD/VISA"],
      plan: { id: plan.id, name: plan.name, price, features: plan.features },
      billing_period,
    })
  } catch (error) {
    console.error("[Subscription Checkout] Error:", error)
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to initiate checkout" })
  }
}
