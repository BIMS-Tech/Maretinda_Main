import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import crypto from "crypto"
import { sendNotice } from "../../../lib/notify"
import { emailVerificationRequired, sellerVerificationLink, VERIFY_LINK_DAYS } from "../../../lib/email-verification"
import { parseApplication, SELLER_TERMS_VERSION } from "../../../lib/seller-application"
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
 * An application to sell, from the seller panel's registration chat. The
 * applicant's login already exists (created just before); approving the
 * application creates the shop. Documents are uploaded later, in verification.
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
    const input = parseApplication(body)
    if (typeof input === "string") return res.status(400).json({ message: input }) as any

    // One application under review per email: a second submit (a double click,
    // or coming back later) would otherwise queue a duplicate for the team
    const pending = await db("seller_application")
      .whereRaw("lower(email) = ?", [input.email])
      .where("status", "pending")
      .first("id")
    if (pending) {
      return res.status(409).json({
        code: "application_pending",
        message: "You already have an application under review. We will email you as soon as there is a decision.",
      }) as any
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

    const now = new Date()
    await db("seller_application").insert({
      id,
      submitted_at: now,
      auth_identity_id: authIdentityId,
      ...input,
      complete_address: input.business_address,
      business_mobile: input.mobile_number,
      merchant_category: input.main_category,
      terms_accepted_at: now,
      terms_version: SELLER_TERMS_VERSION,
      privacy_consent_at: now,
      status: "pending",
    })

    const applicant = `${input.first_name} ${input.last_name}`
    // The team can approve only once the applicant has confirmed this address
    const confirmUrl = emailVerificationRequired() ? await sellerVerificationLink(db, id, input.email) : null
    await sendNotice(req.scope, {
      to: input.email,
      subject: confirmUrl
        ? "Confirm your email to finish your Maretinda seller application"
        : "We received your Maretinda seller application",
      eyebrow: "Seller application",
      heading: confirmUrl ? "Please confirm your email" : "Application received",
      user_name: applicant,
      paragraphs: [
        `Thank you for applying to sell on Maretinda as ${input.shop_name}.`,
        ...(confirmUrl
          ? ["Please confirm this is your email address. Our team reviews your application once it is confirmed."]
          : []),
        "We will email you as soon as there is a decision, usually within a few business days.",
      ],
      button: confirmUrl ? { label: "Confirm my email", url: confirmUrl } : null,
      note: confirmUrl ? `The link works for ${VERIFY_LINK_DAYS} days. Reference: ${id}` : `Reference: ${id}`,
    })
    await sendNotice(req.scope, {
      to: process.env.SELLER_APPLICATION_NOTIFY_EMAIL || "sales@bims.tech",
      subject: `New seller application: ${input.shop_name}`,
      eyebrow: "Seller application",
      heading: "New application to review",
      user_name: "team",
      paragraphs: [
        `${applicant} (${input.email}) applied to sell as ${input.shop_name} (${input.business_name}, ${input.form_of_organization}).`,
        `Sells: ${input.main_category}, ${input.product_count} products, ${input.product_source.toLowerCase()}.${input.sells_regulated ? " Includes FDA-regulated products." : ""}`,
        confirmUrl
          ? "They have been asked to confirm their email; you can approve once they have (or mark it confirmed in the review if you checked it another way)."
          : "Open Requests in the admin panel to approve or reject it.",
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
