import crypto from "crypto"
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { verify } from "jsonwebtoken"
import { sellerPanelUrl, sendNotice, storefrontUrl } from "./notify"

/**
 * Email confirmation for buyers and seller applicants.
 *
 * A link with a one-time token goes out at sign-up (buyers) or with the
 * application (sellers). Buyers must confirm before they can pay or place an
 * order, so order updates reach a real inbox and throwaway sign-ups can't
 * order. Applicants must confirm before the team can approve them, unless an
 * admin marks the address as checked another way.
 *
 * Accounts that existed before this shipped, and Google sign-ups (Google has
 * already checked the address), count as confirmed.
 */

export type VerificationKind = "customer" | "seller_application"

export const VERIFY_LINK_DAYS = 3

/** On in production (and on the test site), off in local development and tests unless switched on. */
export const emailVerificationRequired = () =>
  process.env.EMAIL_VERIFICATION_REQUIRED
    ? process.env.EMAIL_VERIFICATION_REQUIRED !== "false"
    : process.env.NODE_ENV === "production"

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex")

const pgOf = (container: any) => container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

/** A new one-time link token. Only its hash is stored. */
export async function issueVerificationToken(
  pg: any,
  kind: VerificationKind,
  subjectId: string,
  email: string
): Promise<string> {
  const token = crypto.randomBytes(32).toString("base64url")
  await pg("email_verification_token").insert({
    token_hash: hashToken(token),
    kind,
    subject_id: subjectId,
    email: email.trim().toLowerCase(),
    expires_at: new Date(Date.now() + VERIFY_LINK_DAYS * 24 * 60 * 60 * 1000),
  })
  return token
}

export type ConfirmResult =
  | { ok: true; kind: VerificationKind; email: string; already: boolean }
  | { ok: false; reason: "invalid" | "expired" | "changed" }

/**
 * Uses a link token. A link that was already used still answers "confirmed",
 * since mail scanners and double clicks open links twice.
 */
export async function confirmVerificationToken(pg: any, token: string): Promise<ConfirmResult> {
  if (!token || token.length > 200) return { ok: false, reason: "invalid" }
  return pg.transaction(async (trx: any) => {
    const row = await trx("email_verification_token").where("token_hash", hashToken(token)).forUpdate().first()
    if (!row) return { ok: false, reason: "invalid" } as const
    if (!row.used_at && new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: "expired" } as const

    if (row.kind === "customer") {
      const customer = await trx("customer").where("id", row.subject_id).whereNull("deleted_at").first("id", "email")
      // The link confirms the address it was sent to, not whatever the account uses now
      if (!customer || String(customer.email).toLowerCase() !== row.email) return { ok: false, reason: "changed" } as const
      const before = await trx("customer_email_verified").where("customer_id", row.subject_id).first("email")
      await trx("customer_email_verified")
        .insert({ customer_id: row.subject_id, email: row.email, method: "link", verified_at: new Date() })
        .onConflict("customer_id")
        .merge(["email", "method", "verified_at"])
      await trx("email_verification_token").where("token_hash", row.token_hash).update({ used_at: row.used_at ?? new Date() })
      return { ok: true, kind: "customer", email: row.email, already: !!row.used_at || before?.email === row.email } as const
    }

    const app = await trx("seller_application").where("id", row.subject_id).first("id", "email", "email_verified_at")
    if (!app || String(app.email).toLowerCase() !== row.email) return { ok: false, reason: "changed" } as const
    if (!app.email_verified_at) {
      await trx("seller_application").where("id", app.id).update({ email_verified_at: new Date(), email_verified_by: "link" })
    }
    await trx("email_verification_token").where("token_hash", row.token_hash).update({ used_at: row.used_at ?? new Date() })
    return { ok: true, kind: "seller_application", email: row.email, already: !!app.email_verified_at } as const
  })
}

/** Signed up with Google: Google has already confirmed the address. */
async function signedUpWithGoogle(pg: any, customerId: string): Promise<boolean> {
  const row = await pg("auth_identity as ai")
    .join("provider_identity as pi", "pi.auth_identity_id", "ai.id")
    .whereRaw(`ai.app_metadata->>'customer_id' = ?`, [customerId])
    .where("pi.provider", "google")
    .first("pi.id")
  return !!row
}

export type CustomerEmailState = { exists: boolean; verified: boolean; email: string | null; first_name?: string | null }

/**
 * Whether a buyer's current email is confirmed. Guest checkouts (no account)
 * have nothing to confirm. A Google sign-up is recorded as confirmed the first
 * time it is checked.
 */
export async function customerEmailState(pg: any, customerId: string): Promise<CustomerEmailState> {
  const customer = await pg("customer")
    .where("id", customerId)
    .whereNull("deleted_at")
    .first("id", "email", "has_account", "first_name")
  if (!customer) return { exists: false, verified: false, email: null }
  const email = String(customer.email ?? "").toLowerCase()
  const state = { exists: true, email, first_name: customer.first_name }
  if (!customer.has_account) return { ...state, verified: true }

  const row = await pg("customer_email_verified").where("customer_id", customerId).first("email")
  if (row && row.email === email) return { ...state, verified: true }

  if (await signedUpWithGoogle(pg, customerId)) {
    await pg("customer_email_verified")
      .insert({ customer_id: customerId, email, method: "google" })
      .onConflict("customer_id")
      .merge(["email", "method", "verified_at"])
    return { ...state, verified: true }
  }
  return { ...state, verified: false }
}

/** Marks a buyer's current email as confirmed (Google sign-up, or checked by support). */
export async function markCustomerVerified(pg: any, customerId: string, method: string, by?: string | null) {
  const customer = await pg("customer").where("id", customerId).whereNull("deleted_at").first("email")
  if (!customer?.email) return false
  await pg("customer_email_verified")
    .insert({ customer_id: customerId, email: String(customer.email).toLowerCase(), method, verified_by: by ?? null, verified_at: new Date() })
    .onConflict("customer_id")
    .merge(["email", "method", "verified_by", "verified_at"])
  return true
}

const LINK_NOTE = `The link works for ${VERIFY_LINK_DAYS} days.`

/** The buyer's sign-up email: welcome plus the confirmation link. */
export async function sendCustomerVerification(container: any, customerId: string, opts: { welcome: boolean }) {
  const pg = pgOf(container)
  const state = await customerEmailState(pg, customerId)
  if (!state.exists || state.verified || !state.email) return false
  const token = await issueVerificationToken(pg, "customer", customerId, state.email)
  return sendNotice(container, {
    to: state.email,
    subject: opts.welcome ? "Welcome to Maretinda – please confirm your email" : "Confirm your email for Maretinda",
    eyebrow: "Your account",
    heading: "Confirm your email address",
    user_name: state.first_name,
    paragraphs: [
      ...(opts.welcome ? ["Thanks for creating your Maretinda account."] : []),
      "Please confirm this is your email address. We send your order updates here, and you need to confirm it before you place your first order.",
    ],
    button: { label: "Confirm my email", url: `${storefrontUrl()}/verify-email?token=${encodeURIComponent(token)}` },
    note: `${LINK_NOTE} If you didn't create this account, you can ignore this email.`,
  })
}

/** The applicant's confirmation link, alone (the "application received" email carries the first one). */
export async function sellerVerificationLink(pg: any, applicationId: string, email: string) {
  const token = await issueVerificationToken(pg, "seller_application", applicationId, email)
  return `${sellerPanelUrl()}/verify-email?token=${encodeURIComponent(token)}`
}

export async function resendSellerVerification(container: any, app: { id: string; email: string; first_name?: string; last_name?: string; shop_name?: string }) {
  const url = await sellerVerificationLink(pgOf(container), app.id, app.email)
  return sendNotice(container, {
    to: app.email,
    subject: "Confirm your email for your Maretinda seller application",
    eyebrow: "Seller application",
    heading: "Confirm your email address",
    user_name: [app.first_name, app.last_name].filter(Boolean).join(" ") || null,
    paragraphs: [
      `Please confirm this is your email address so our team can review your application${app.shop_name ? ` for ${app.shop_name}` : ""}.`,
    ],
    button: { label: "Confirm my email", url },
    note: `${LINK_NOTE} Reference: ${app.id}`,
  })
}

/** Reads a store request's own Bearer token, which the store routes don't authenticate for us. */
export function bearerPayload(req: MedusaRequest): any | null {
  const header = String(req.headers.authorization || "")
  const token = header.startsWith("Bearer ") ? header.slice(7) : ""
  if (!token) return null
  try {
    const { projectConfig } = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE) as any
    return verify(token, projectConfig.http.jwtSecret as string)
  } catch {
    return null
  }
}

export const NOT_VERIFIED_MESSAGE = (email: string | null) =>
  `Please confirm your email address before placing an order. We sent a link to ${email || "your email"}; you can ask for a new one at checkout.`

/** The buyer behind a cart: the signed-in customer, or the cart's own. */
async function cartCustomerId(req: MedusaRequest, pg: any): Promise<string | null> {
  const auth = (req as any).auth_context
  if (auth?.actor_type === "customer" && auth.actor_id) return auth.actor_id
  const payload = bearerPayload(req)
  if (payload?.actor_type === "customer" && payload.actor_id) return payload.actor_id

  const id = String((req.params as any)?.id ?? "")
  if (id.startsWith("pay_col") || String((req as any).originalUrl ?? req.path).includes("/payment-collections/")) {
    const row = await pg("cart_payment_collection as l")
      .join("cart as c", "c.id", "l.cart_id")
      .where("l.payment_collection_id", id)
      .whereNull("l.deleted_at")
      .first("c.customer_id")
    return row?.customer_id ?? null
  }
  const cart = await pg("cart").where("id", id).first("customer_id")
  return cart?.customer_id ?? null
}

/**
 * Refuses to start a payment or place an order for a buyer whose email isn't
 * confirmed. Sits on the payment step as well as order completion so an online
 * payment is never taken for an order that would then be refused.
 */
export async function requireVerifiedEmail(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  try {
    if (req.method !== "POST" || !emailVerificationRequired()) return next()
    const pg = pgOf(req.scope)
    const customerId = await cartCustomerId(req, pg)
    if (!customerId) return next()
    const state = await customerEmailState(pg, customerId)
    if (!state.exists || state.verified) return next()
    return res.status(403).json({ type: "not_allowed", code: "email_not_verified", message: NOT_VERIFIED_MESSAGE(state.email) })
  } catch (error) {
    next(error)
  }
}
