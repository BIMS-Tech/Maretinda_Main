import crypto from "crypto"
import { authenticate } from "@medusajs/framework/http"
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { generateSecret, verifyTotp } from "./totp"

/* ───────────────────────────── Roles ───────────────────────────── */

export const ADMIN_ROLES = ["owner", "manager", "finance", "support", "viewer"] as const
export type AdminRole = (typeof ADMIN_ROLES)[number]

/** What an admin may change. Everyone may read, except the few areas below. */
export type Area = "settings" | "finance" | "operations" | "support"

export const ROLE_LABEL: Record<AdminRole, string> = {
  owner: "Owner",
  manager: "Manager",
  finance: "Finance",
  support: "Support",
  viewer: "Viewer",
}

const ROLE_AREAS: Record<AdminRole, Area[]> = {
  owner: ["settings", "finance", "operations", "support"],
  manager: ["operations", "support"],
  finance: ["finance"],
  support: ["support"],
  viewer: [],
}

export const roleAllows = (role: AdminRole, area: Area) => ROLE_AREAS[role].includes(area)
export const roleAreas = (role: AdminRole) => ROLE_AREAS[role]

/** Changes, by the first part of the /admin path. Anything not listed needs an owner. */
const WRITE_AREA: Record<string, Area> = {
  // Money
  settlement: "finance", tama: "finance", dft: "finance", reports: "finance", invoices: "finance",
  "cod-remittances": "finance", giyapay: "finance", payments: "finance", "payment-collections": "finance",
  subscriptions: "finance", commission: "finance",
  // Running the marketplace
  sellers: "operations", "seller-applications": "operations", "seller-verifications": "operations",
  documents: "operations", requests: "operations", products: "operations", "product-variants": "operations",
  "product-categories": "operations", "product-tags": "operations", "product-types": "operations",
  collections: "operations", attributes: "operations", brands: "operations", "inventory-items": "operations",
  reservations: "operations", "price-lists": "operations", promotions: "operations", campaigns: "operations",
  "flash-sales": "operations", orders: "operations", "order-sets": "operations", "order-edits": "operations",
  "draft-orders": "operations", claims: "operations", exchanges: "operations", fulfillments: "operations",
  "shipping-orders": "operations", "newsletter-subscribers": "operations", uploads: "operations",
  upload: "operations", "trending-products": "operations", "customer-groups": "operations",
  // Helping buyers and sellers
  returns: "support", "return-request": "support", "listing-reports": "support", reviews: "support",
  customers: "support", chat: "support", reels: "support", "return-cases": "support", "cancellation-requests": "support",
  // Refunds and what sellers owe: money
  refunds: "finance", "refund-receipts": "finance", "seller-charges": "finance", "seller-deposits": "finance",
}

/** Reading these shows bank details, private IDs, keys or other admins' activity. */
const READ_AREA: Record<string, Area> = {
  "api-keys": "settings", invites: "settings", "audit-log": "settings", "admin-roles": "settings",
  settlement: "finance", tama: "finance", dft: "finance", reports: "finance",
  documents: "operations",
  // Buyers' bank and e-wallet details, and their claim evidence
  refunds: "finance", "seller-deposits": "finance", "return-cases": "support", "return-evidence": "support",
}

const READS = ["GET", "HEAD", "OPTIONS"]

/**
 * The area an admin request touches, or null when any signed-in admin may make
 * it (reads, their own profile, their own two-step sign-in).
 */
export function areaOf(method: string, path: string, actorId: string): Area | null {
  const parts = path.replace(/^\/admin\/?/, "").split("/").filter(Boolean)
  const [first, second] = parts
  if (!first) return null
  if (first === "mfa") return null
  if (first === "admin-roles" && second === "me") return null
  if (first === "users" && (second === "me" || (second === actorId && !parts[2]))) return null
  // Saved table layouts and the notification feed are each admin's own
  if (first === "views" || first === "notifications") return null
  if (READS.includes(method.toUpperCase())) return READ_AREA[first] ?? null
  return WRITE_AREA[first] ?? "settings"
}

/** An admin's role. With no owner on record at all, everyone is an owner, so access can't be lost. */
export async function roleOf(pg: any, userId: string): Promise<{ role: AdminRole; email: string | null }> {
  const user = await pg("user").where("id", userId).first("email")
  const email = user?.email ? String(user.email).toLowerCase() : null
  const row = email ? await pg("admin_role").where("email", email).first("role") : null
  if (row?.role) return { role: row.role, email }
  const owners = await pg("admin_role").where("role", "owner").count("email as n").first()
  return { role: Number(owners?.n ?? 0) === 0 ? "owner" : "viewer", email }
}

/* ─────────────────────────── Two-step sign-in ─────────────────────────── */

/** Required for every admin in production; ADMIN_MFA_REQUIRED=false turns that off (not the check for those who use it). */
export const mfaRequired = () =>
  process.env.ADMIN_MFA_REQUIRED ? process.env.ADMIN_MFA_REQUIRED !== "false" : process.env.NODE_ENV === "production"

const key = () =>
  crypto.createHash("sha256").update(`maretinda-admin-mfa:${process.env.MFA_ENCRYPTION_KEY || process.env.COOKIE_SECRET || "supersecret"}`).digest()

export function encryptSecret(secret: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv)
  const data = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()])
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64")).join(".")
}

export function decryptSecret(stored: string): string {
  const [iv, tag, data] = stored.split(".").map((p) => Buffer.from(p, "base64"))
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8")
}

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex")

const RECOVERY_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"
const normalizeRecovery = (code: string) => String(code ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")

/** Ten one-time codes for when the phone is lost: shown once, stored hashed. */
export function newRecoveryCodes(): { codes: string[]; hashes: string[] } {
  const codes = Array.from({ length: 10 }, () => {
    const bytes = crypto.randomBytes(8)
    const chars = Array.from(bytes, (b) => RECOVERY_ALPHABET[b % RECOVERY_ALPHABET.length]).join("")
    return `${chars.slice(0, 4)}-${chars.slice(4, 8)}`
  })
  return { codes, hashes: codes.map((c) => sha256(normalizeRecovery(c))) }
}

/** The sign-in this request was made with: its bearer token, or else its session. */
function credentialOf(req: MedusaRequest): { hash: string; expiresAt: Date } | null {
  const header = String(req.headers.authorization ?? "")
  if (header.startsWith("Bearer ")) {
    const token = header.slice(7)
    let expiresAt = new Date(Date.now() + 24 * 3600 * 1000)
    try {
      const payload = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8"))
      if (typeof payload?.exp === "number") expiresAt = new Date(payload.exp * 1000)
    } catch {
      // not a JWT; keep the default
    }
    return { hash: sha256(`bearer:${token}`), expiresAt }
  }
  const sessionId = (req as any).sessionID || (req as any).session?.id
  if (sessionId) return { hash: sha256(`session:${sessionId}`), expiresAt: new Date(Date.now() + 24 * 3600 * 1000) }
  return null
}

export async function mfaOf(pg: any, userId: string) {
  const row = await pg("admin_mfa").where("user_id", userId).first()
  return { row, enabled: !!row?.enabled_at }
}

/** Marks this sign-in as having passed the second step. */
export async function markVerified(pg: any, req: MedusaRequest, userId: string) {
  const cred = credentialOf(req)
  if (!cred) return
  await pg("admin_mfa_session")
    .insert({ token_hash: cred.hash, user_id: userId, verified_at: new Date(), expires_at: cred.expiresAt })
    .onConflict("token_hash")
    .merge()
  await pg("admin_mfa_session").where("expires_at", "<", new Date()).delete()
}

async function isVerified(pg: any, req: MedusaRequest, userId: string): Promise<boolean> {
  const cred = credentialOf(req)
  if (!cred) return false
  const row = await pg("admin_mfa_session")
    .where({ token_hash: cred.hash, user_id: userId })
    .where("expires_at", ">", new Date())
    .first("token_hash")
  return !!row
}

/** Starts (or restarts) setting up: a new secret, not yet switched on. */
export async function beginSetup(pg: any, userId: string): Promise<string> {
  const secret = generateSecret()
  await pg("admin_mfa")
    .insert({ user_id: userId, secret_enc: encryptSecret(secret), enabled_at: null, last_step: null, recovery_hashes: JSON.stringify([]) })
    .onConflict("user_id")
    .merge()
  return secret
}

/**
 * Checks a code: an authenticator code, or (when allowed) one of the recovery
 * codes, which is used up. Returns how it passed, or null.
 */
export async function checkCode(pg: any, userId: string, code: string, allowRecovery: boolean): Promise<"totp" | "recovery" | null> {
  const { row } = await mfaOf(pg, userId)
  if (!row) return null
  const step = verifyTotp(decryptSecret(row.secret_enc), code, Date.now(), row.last_step == null ? null : Number(row.last_step))
  if (step != null) {
    await pg("admin_mfa").where("user_id", userId).update({ last_step: step })
    return "totp"
  }
  if (!allowRecovery || !row.enabled_at) return null
  const hash = sha256(normalizeRecovery(code))
  const hashes: string[] = Array.isArray(row.recovery_hashes) ? row.recovery_hashes : JSON.parse(row.recovery_hashes || "[]")
  if (!hashes.includes(hash)) return null
  await pg("admin_mfa").where("user_id", userId).update({ recovery_hashes: JSON.stringify(hashes.filter((h) => h !== hash)) })
  return "recovery"
}

/* ─────────────────────────────── The gate ─────────────────────────────── */

const deny = (res: MedusaResponse, code: string, message: string) =>
  res.status(403).json({ type: "not_allowed", code, message })

/**
 * Some routes (admin users, invites) skip Medusa's general /admin sign-in check
 * and authenticate later in their own middleware, after this one. Read the
 * sign-in here too, so those routes can't slip past the gate. Without a valid
 * sign-in the request carries on unchanged, and the route's own check refuses it.
 */
const readSignIn = authenticate("user", ["bearer", "session", "api-key"], { allowUnauthenticated: true })

/**
 * Runs on every /admin request after sign-in: first the second step, then the
 * admin's role. Secret API keys sign in as actor type "api-key", not "user",
 * and are left alone: only owners can create them.
 */
export function adminAccessGate(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  if ((req as any).auth_context) return gate(req, res, next)
  readSignIn(req as any, res as any, (error?: unknown) => (error ? next(error) : gate(req, res, next)))
}

async function gate(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  try {
    const auth = (req as any).auth_context
    if (!auth?.actor_id || auth.actor_type !== "user") return next()
    const userId: string = auth.actor_id
    const path = (req.originalUrl || req.url || "").split("?")[0]
    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

    if (!path.startsWith("/admin/mfa")) {
      const { enabled } = await mfaOf(pg, userId)
      if (enabled) {
        if (!(await isVerified(pg, req, userId))) {
          return deny(res, "mfa_required", "Enter the code from your authenticator app to continue.")
        }
      } else if (mfaRequired()) {
        return deny(res, "mfa_setup_required", "Set up two-step sign-in to continue.")
      }
    }

    const area = areaOf(req.method, path, userId)
    if (area) {
      const { role } = await roleOf(pg, userId)
      if (!roleAllows(role, area)) {
        return deny(res, "role_not_allowed", `Your admin role (${ROLE_LABEL[role]}) can't do this. Ask an owner to change your role if you need to.`)
      }
    }
    next()
  } catch (error) {
    next(error)
  }
}
