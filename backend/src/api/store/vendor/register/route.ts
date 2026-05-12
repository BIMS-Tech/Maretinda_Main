import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * POST /store/vendor/register
 *
 * Public endpoint — registers a new vendor after verifying their GiyaPay subscription payment.
 *
 * Steps:
 *  1. Verify the payment reference (must be a vsub_ transaction, SUCCESS, unclaimed)
 *  2. Call Medusa's vendor auth registration endpoint internally
 *  3. Extract member_id from the JWT token
 *  4. Wait for Mercur to create the seller record, then look it up
 *  5. Update seller name
 *  6. Auto-activate the seller (no admin approval needed)
 *  7. Create the subscription record
 *  8. Claim the giyapay_transaction by setting vendor_id
 *
 * Request body:
 * {
 *   "name": "My Store Name",
 *   "email": "vendor@example.com",
 *   "password": "secure_password",
 *   "payment_reference": "GIYAPAY-REF-123",
 *   "plan_name": "Foundation"
 * }
 *
 * Sample response (201):
 * {
 *   "success": true,
 *   "message": "Vendor account created. You can now log in to your vendor panel.",
 *   "vendor_panel_url": "https://vendor.maretinda.com"
 * }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const { name, email, password, payment_reference, plan_name } = req.body as any

    // --- Validation ---
    if (!name || !email || !password || !payment_reference || !plan_name) {
      res.status(400).json({ message: "name, email, password, payment_reference and plan_name are all required" })
      return
    }

    let pgConnection: any
    try {
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch {
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    // --- 1. Verify payment ---
    const txn = await pgConnection("giyapay_transaction")
      .where("reference_number", payment_reference)
      .first()

    if (!txn || txn.status !== "SUCCESS") {
      res.status(400).json({ message: "Payment reference is invalid or payment was not successful." })
      return
    }

    if (!txn.order_id || !String(txn.order_id).startsWith("vsub_")) {
      res.status(400).json({ message: "This payment reference is not for a vendor subscription." })
      return
    }

    if (txn.vendor_id) {
      res.status(409).json({ message: "This payment has already been used to create a vendor account." })
      return
    }

    // --- 2. Look up the plan ---
    const parts = String(txn.order_id).split("_")
    const planSlug = parts.slice(1, parts.length - 1).join("_")
    const plans = await pgConnection("subscription_plan").where("status", "active")
    const plan = plans.find(
      (p: any) => p.name.toLowerCase().replace(/\s+/g, "_") === planSlug
    ) || plans.find((p: any) => p.name === plan_name)

    if (!plan) {
      res.status(400).json({ message: "Subscription plan not found." })
      return
    }

    // --- 3. Register the vendor via Medusa auth API ---
    const backendUrl = (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 9000}`).replace(/\/$/, "")

    const authRes = await fetch(`${backendUrl}/auth/vendor/emailpass/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (!authRes.ok) {
      const authError = await authRes.json().catch(() => ({}))
      const errorMsg = (authError as any)?.message || "Registration failed"

      if (authRes.status === 422 || errorMsg.toLowerCase().includes("already")) {
        res.status(409).json({ message: "An account with this email already exists." })
      } else {
        res.status(400).json({ message: errorMsg })
      }
      return
    }

    const authData = await authRes.json() as any
    const token: string = authData.token

    if (!token) {
      res.status(500).json({ message: "Registration succeeded but no token was returned." })
      return
    }

    // --- 4. Decode JWT to get member_id (actor_id) ---
    let memberId: string | null = null
    try {
      const [, payloadB64] = token.split(".")
      const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString())
      memberId = payload.actor_id || payload.sub || null
    } catch {
      // JWT decode failed — fall back to DB lookup below
    }

    // Short pause to allow Mercur's async seller creation to complete
    await new Promise((r) => setTimeout(r, 500))

    // --- 5. Look up seller_id via member ---
    let sellerId: string | null = null

    if (memberId) {
      const member = await pgConnection("member").where("id", memberId).first()
      sellerId = member?.seller_id || null
    }

    // Fallback: look up member by email if we don't have the ID
    if (!sellerId) {
      const member = await pgConnection("member").where("email", email).orderBy("created_at", "desc").first()
      sellerId = member?.seller_id || null
      memberId = member?.id || memberId
    }

    if (!sellerId) {
      // Registration succeeded — subscription will be created when vendor logs in
      console.warn(`[VendorRegister] Could not find seller_id for member ${memberId}. Subscription deferred.`)
      res.status(201).json({
        success: true,
        message: "Vendor account created. You can now log in to your vendor panel.",
        vendor_panel_url: process.env.VENDOR_PANEL_URL || "",
        deferred: true,
      })
      return
    }

    // --- 6. Update seller name ---
    try {
      await pgConnection("seller").where("id", sellerId).update({
        name,
        // Force-activate the seller (bypass admin approval for payment-verified vendors)
        is_active: true,
        updated_at: new Date(),
      })
    } catch {
      // Column names may differ — try alternate field names
      try {
        await pgConnection("seller").where("id", sellerId).update({ name, updated_at: new Date() })
      } catch { /* non-fatal */ }
    }

    // Also activate the member record if there's an active/status column
    try {
      await pgConnection("member").where("id", memberId).update({ active: true })
    } catch { /* column may not exist, non-fatal */ }

    // --- 7. Create subscription ---
    const { randomBytes } = await import("crypto")
    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 30)

    try {
      await pgConnection("vendor_subscription").insert({
        id: `vsub_${randomBytes(12).toString("hex")}`,
        vendor_id: sellerId,
        plan_name: plan.name,
        price: plan.price,
        start_date: startDate,
        end_date: endDate,
        status: "active",
        auto_renew: false,
        payment_reference,
        created_at: new Date(),
        updated_at: new Date(),
      })
    } catch (subErr) {
      console.error("[VendorRegister] Failed to create subscription (non-fatal):", subErr)
    }

    // --- 8. Claim the giyapay_transaction ---
    try {
      await pgConnection("giyapay_transaction")
        .where("reference_number", payment_reference)
        .update({ vendor_id: sellerId, updated_at: new Date() })
    } catch (claimErr) {
      console.error("[VendorRegister] Failed to claim transaction (non-fatal):", claimErr)
    }

    console.log(`[VendorRegister] Vendor ${sellerId} registered successfully on plan ${plan.name}`)

    res.status(201).json({
      success: true,
      message: "Vendor account created successfully. You can now log in to your vendor panel.",
      vendor_panel_url: process.env.VENDOR_PANEL_URL || "",
    })
  } catch (error) {
    console.error("[VendorRegister] Error:", error)
    res.status(500).json({ message: error instanceof Error ? error.message : "Registration failed" })
  }
}
