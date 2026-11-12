import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import crypto from "crypto"
import { sendNotice } from "../../../lib/notify"
import { verify } from "jsonwebtoken"

function getDb(req: any) {
  try {
    return req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  } catch {
    return (req.scope as any).__pg_connection__
  }
}

const MAX_FIELD_LENGTH = 2000
const MAX_DOCUMENTS_LENGTH = 20000

/**
 * POST /store/seller-application
 * Receives the multi-step registration form payload (JSON body) and an
 * optional ?documents= query param (pre-uploaded GCS URLs come in body too).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const body = req.body as any
    const db = getDb(req)

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({ message: "Invalid application" }) as any
    }
    const tooLong = Object.entries(body).some(
      ([key, value]) => key !== "documents" && typeof value === "string" && value.length > MAX_FIELD_LENGTH
    )
    if (tooLong || JSON.stringify(body.documents ?? null).length > MAX_DOCUMENTS_LENGTH) {
      return res.status(400).json({ message: "One of the fields is too long" }) as any
    }
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email))) {
      return res.status(400).json({ message: "Please enter a valid email address" }) as any
    }

    const id = `sapp_${crypto.randomBytes(10).toString("hex")}`

    // The seller's auth identity (created at registration via
    // /auth/seller/emailpass/register) is carried in the Bearer token. Store it
    // so approving the application can create + activate the seller account.
    let authIdentityId: string | null = null
    try {
      const authHeader = (req.headers["authorization"] as string) || ""
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
      if (token) {
        // Verified, not just decoded: approving the application activates this
        // identity, so an unsigned token could otherwise name someone else's.
        const { projectConfig } = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE) as any
        const payload = verify(token, projectConfig.http.jwtSecret as string) as any
        authIdentityId = payload?.auth_identity_id || null
      }
    } catch {
      // best-effort; application can still be reviewed manually
    }

    await db("seller_application").insert({
      id,
      submitted_at: new Date(),
      auth_identity_id: authIdentityId,
      first_name: body.first_name || "",
      last_name: body.last_name || "",
      complete_address: body.complete_address || "",
      mobile_number: body.mobile_number || "",
      email: body.email || "",
      designation: body.designation || null,
      target_go_live: body.target_go_live || null,
      business_name: body.business_name || "",
      business_address: body.business_address || "",
      business_landline: body.business_landline || null,
      business_mobile: body.business_mobile || null,
      business_email: body.business_email || null,
      business_tin: body.business_tin || null,
      form_of_organization: body.form_of_organization || "",
      merchant_category: body.merchant_category || null,
      business_activity: body.business_activity || null,
      signatory_first_name: body.signatory_first_name || null,
      signatory_middle_name: body.signatory_middle_name || null,
      signatory_last_name: body.signatory_last_name || null,
      signatory_email: body.signatory_email || null,
      signatory_landline: body.signatory_landline || null,
      signatory_mobile: body.signatory_mobile || null,
      merchant_trade_name: body.merchant_trade_name || null,
      charge_to: body.charge_to || null,
      gateway_account_type: body.gateway_account_type || null,
      pay_button_type: body.pay_button_type || null,
      selected_gateways: body.selected_gateways || null,
      payment_links_feature: body.payment_links_feature ?? null,
      editable_amount_feature: body.editable_amount_feature ?? null,
      minimum_amount_type: body.minimum_amount_type || null,
      minimum_amount_value: body.minimum_amount_value || null,
      estimated_monthly_hits: body.estimated_monthly_hits || null,
      estimated_amount_per_transaction: body.estimated_amount_per_transaction || null,
      beneficiary_bank: body.beneficiary_bank || null,
      bank_address: body.bank_address || null,
      bank_account_name: body.bank_account_name || null,
      bank_account_number: body.bank_account_number || null,
      settlement_type: body.settlement_type || null,
      brand_colors: body.brand_colors || null,
      digital_support: body.digital_support || null,
      has_marketing_budget: body.has_marketing_budget ?? null,
      promo_code: body.promo_code || null,
      documents: body.documents ? JSON.stringify(body.documents) : null,
      status: "pending",
    })

    const applicant = `${body.first_name || ""} ${body.last_name || ""}`.trim()
    await sendNotice(req.scope, {
      to: body.email,
      subject: "We received your Maretinda seller application",
      eyebrow: "Seller application",
      heading: "Application received",
      user_name: applicant,
      paragraphs: [
        `Thank you for applying to sell on Maretinda${body.business_name ? ` as ${body.business_name}` : ""}.`,
        "Our team is reviewing your application. We will email you as soon as there is a decision, usually within a few business days.",
      ],
      note: `Reference: ${id}`,
    })
    await sendNotice(req.scope, {
      to: process.env.SELLER_APPLICATION_NOTIFY_EMAIL || "sales@bims.tech",
      subject: `New seller application: ${body.business_name || applicant || body.email}`,
      eyebrow: "Seller application",
      heading: "New application to review",
      user_name: "team",
      paragraphs: [
        `${applicant || "An applicant"} (${body.email || "no email"}) applied to sell as ${body.business_name || "an unnamed business"}.`,
        "Open Requests in the admin panel to approve or reject it.",
      ],
      note: `Reference: ${id}`,
    })

    res.status(201).json({
      success: true,
      application_id: id,
      message: "Your application has been submitted. We will review and activate your account shortly.",
    })
  } catch (error) {
    console.error("[SellerApplication] POST error:", error)
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to submit application" })
  }
}
