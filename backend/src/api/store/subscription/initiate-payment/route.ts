import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import crypto from "crypto"

/**
 * POST /store/subscription/initiate-payment
 *
 * Public endpoint — generates GiyaPay form data for a subscription plan purchase.
 * The store renders a hidden form and auto-submits it to GiyaPay's checkout URL.
 *
 * Request body:
 * { "plan_name": "Foundation" }
 *
 * Sample response:
 * {
 *   "checkout_url": "https://sandbox.giyapay.com/checkout",
 *   "form_data": {
 *     "merchant_id": "...",
 *     "order_id": "vsub_foundation_1745...",
 *     "amount": "99900",
 *     "currency": "PHP",
 *     "description": "Maretinda seller Subscription - Foundation Plan",
 *     "nonce": "...",
 *     "timestamp": "...",
 *     "signature": "...",
 *     "success_callback": "https://store.com/giyapay/success",
 *     "error_callback": "https://store.com/giyapay/error",
 *     "cancel_callback": "https://store.com/giyapay/cancel"
 *   },
 *   "enabled_methods": ["GCASH", "INSTAPAY", "MASTERCARD/VISA"],
 *   "plan": { "name": "Foundation", "price": 999, "features": {...} }
 * }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const { plan_name } = req.body as any

    if (!plan_name || typeof plan_name !== "string") {
      res.status(400).json({ message: "plan_name is required" })
      return
    }

    let pgConnection: any
    try {
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch {
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    // Validate plan exists
    const plan = await pgConnection("subscription_plan")
      .where("name", plan_name)
      .where("status", "active")
      .first()

    if (!plan) {
      res.status(404).json({ message: `Plan "${plan_name}" not found.` })
      return
    }

    // Load GiyaPay config
    let giyaPayService: any
    try {
      giyaPayService = req.scope.resolve("giyaPayService")
    } catch {
      const GiyaPayService = require("../../../../services/giyapay").default as any
      giyaPayService = new GiyaPayService(req.scope)
    }

    const config = await giyaPayService.getConfig()

    if (!config || !config.merchantId || !config.merchantSecret) {
      res.status(503).json({ message: "Payment gateway not configured. Please contact support." })
      return
    }

    // Build order_id encoding plan slug: vsub_<slug>_<timestamp>
    const planSlug = plan_name.toLowerCase().replace(/\s+/g, "_")
    const orderId = `vsub_${planSlug}_${Date.now()}`

    // Amount in centavos (PHP smallest unit)
    const amountCentavos = Math.round(plan.price * 100).toString()

    const nonce = crypto.randomBytes(16).toString("hex")
    const timestamp = Math.floor(Date.now() / 1000).toString()

    // GiyaPay signature: merchant_id + amount + currency + order_id + timestamp + nonce + secret
    const signatureString = `${config.merchantId}${amountCentavos}PHP${orderId}${timestamp}${nonce}${config.merchantSecret}`
    const signature = crypto.createHash("sha512").update(signatureString).digest("hex")

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
      description: `Maretinda seller Subscription - ${plan.name} Plan`,
      nonce,
      timestamp,
      signature,
      success_callback: `${storefrontUrl}/giyapay/success`,
      error_callback: `${storefrontUrl}/giyapay/error`,
      cancel_callback: `${storefrontUrl}/giyapay/cancel`,
    }

    res.status(200).json({
      checkout_url: checkoutUrl,
      form_data: formData,
      enabled_methods: config.enabledMethods || ["GCASH", "INSTAPAY", "MASTERCARD/VISA"],
      plan: { id: plan.id, name: plan.name, price: plan.price, features: plan.features },
    })
  } catch (error) {
    console.error("[Subscription InitiatePayment] Error:", error)
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to initiate payment" })
  }
}
