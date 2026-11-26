import { createCustomerAccountWorkflow } from "@medusajs/core-flows"
import { ContainerRegistrationKeys, generateJwtToken } from "@medusajs/framework/utils"
import { markCustomerVerified } from "./email-verification"

/**
 * Whose sign-in is this?
 *
 * One email and password can open a shop, shop, or both: Medusa keeps a single
 * sign-in per email and notes on it which accounts it opens. It checks the
 * password without looking at the account type, so a seller's password is
 * accepted on the shopper sign-in and answered with a token that belongs to no
 * shopper. The store uses this to say so plainly and to offer a shopper account
 * on the same sign-in, instead of bouncing the person back to an empty form.
 */
export type SignInState = {
  /** other: a sign-in that isn't for the store (the team's); never named as such */
  kind: "shopper" | "seller" | "applicant" | "unfinished" | "other"
  email: string | null
  first_name?: string | null
  shop_name?: string | null
  application_status?: string | null
  /** Whether a shopper account can be added to this sign-in */
  can_shop: boolean
  /** Another shopper account already uses this email (they signed up with Google) */
  existing_shopper?: boolean
}

type Identity = {
  email: string | null
  memberId: string | null
  userId: string | null
  customerId: string | null
  hasRemovedCustomer: boolean
}

async function readIdentity(pg: any, authIdentityId: string): Promise<Identity | null> {
  const row = await pg("auth_identity").where("id", authIdentityId).whereNull("deleted_at").first("app_metadata")
  if (!row) return null
  const provider = await pg("provider_identity")
    .where({ auth_identity_id: authIdentityId, provider: "emailpass" })
    .whereNull("deleted_at")
    .first("entity_id")
  const meta = row.app_metadata ?? {}
  return {
    email: provider?.entity_id ? String(provider.entity_id).trim().toLowerCase() : null,
    memberId: meta.seller_id ?? null,
    userId: meta.user_id ?? null,
    customerId: meta.customer_id ?? null,
    hasRemovedCustomer: "customer_id" in meta && !meta.customer_id,
  }
}

const applicationOf = (pg: any, authIdentityId: string) =>
  pg("seller_application")
    .where("auth_identity_id", authIdentityId)
    .orderBy("submitted_at", "desc")
    .first("status", "email", "first_name", "last_name", "shop_name", "business_name", "mobile_number", "email_verified_at")

const memberOf = (pg: any, memberId: string | null) =>
  memberId
    ? pg("member as m")
        .join("seller as s", "s.id", "m.seller_id")
        .where("m.id", memberId)
        .whereNull("m.deleted_at")
        .whereNull("s.deleted_at")
        .first("m.name", "m.phone", "s.name as shop_name")
    : null

/** Another shopper account with this email that this sign-in doesn't open. */
const otherShopper = (pg: any, email: string) =>
  pg("customer").whereRaw("lower(email) = ?", [email]).where("has_account", true).whereNull("deleted_at").first("id")

export async function signInState(pg: any, authIdentityId: string): Promise<SignInState | null> {
  const identity = await readIdentity(pg, authIdentityId)
  if (!identity) return null
  const { email } = identity

  if (identity.customerId) {
    const customer = await pg("customer").where("id", identity.customerId).whereNull("deleted_at").first("id", "first_name")
    if (customer) return { kind: "shopper", email, first_name: customer.first_name, can_shop: false }
  }
  // The team's sign-ins open the admin panel only
  if (identity.userId || !email) return { kind: "other", email, can_shop: false }

  const existing_shopper = !!(await otherShopper(pg, email))
  const can_shop = !existing_shopper

  const member = await memberOf(pg, identity.memberId)
  if (member) {
    return { kind: "seller", email, first_name: firstName(member.name), shop_name: member.shop_name, can_shop, existing_shopper }
  }
  const application = await applicationOf(pg, authIdentityId)
  if (application) {
    return {
      kind: "applicant",
      email,
      first_name: application.first_name,
      shop_name: application.shop_name || application.business_name,
      application_status: application.status,
      can_shop,
      existing_shopper,
    }
  }
  return { kind: "unfinished", email, can_shop, existing_shopper }
}

const firstName = (name?: string | null) => String(name ?? "").trim().split(/\s+/)[0] || null
const lastName = (name?: string | null) => String(name ?? "").trim().split(/\s+/).slice(1).join(" ") || null

/**
 * Takes the shopper account off sign-ins, leaving whatever else they open. In
 * SQL because Medusa's update merges this field: it can blank the note but not
 * remove it, and a blanked note stops a new account from ever being attached.
 */
export async function detachShopper(pg: any, authIdentityIds: string[]) {
  if (!authIdentityIds.length) return
  await pg("auth_identity")
    .whereIn("id", authIdentityIds)
    .update({ app_metadata: pg.raw("app_metadata - 'customer_id'"), updated_at: new Date() })
}

export type ShopperProfileResult =
  | { ok: true; customer_id: string }
  | { ok: false; reason: "not_found" | "not_allowed" | "existing_shopper" }

/**
 * Adds a shopper account to a sign-in that doesn't have one yet. The account
 * always takes the sign-in's own email, and never joins an existing shopper
 * account: nothing here proves the two belong to the same person.
 */
export async function createShopperProfile(container: any, authIdentityId: string): Promise<ShopperProfileResult> {
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  return pg.transaction(async (trx: any) => {
    // Two clicks at once must not make two accounts
    await trx.raw("SELECT pg_advisory_xact_lock(hashtext(?))", [`shopper-profile:${authIdentityId}`])

    const state = await signInState(pg, authIdentityId)
    if (!state) return { ok: false, reason: "not_found" } as const
    const identity = (await readIdentity(pg, authIdentityId))!
    if (state.kind === "shopper") return { ok: true, customer_id: identity.customerId! } as const
    if (state.kind === "other" || !identity.email) return { ok: false, reason: "not_allowed" } as const
    if (state.existing_shopper) return { ok: false, reason: "existing_shopper" } as const

    const member = await memberOf(pg, identity.memberId)
    const application = await applicationOf(pg, authIdentityId)

    // Medusa won't attach an account while the note of a removed one is there
    if (identity.hasRemovedCustomer || identity.customerId) await detachShopper(pg, [authIdentityId])

    const { result: customer } = await createCustomerAccountWorkflow(container).run({
      input: {
        authIdentityId,
        customerData: {
          email: identity.email,
          first_name: application?.first_name || firstName(member?.name) || undefined,
          last_name: application?.last_name || lastName(member?.name) || undefined,
          phone: member?.phone || application?.mobile_number || undefined,
        },
      },
    })

    // They already proved this address when they opened the shop
    if (application?.email_verified_at && String(application.email).trim().toLowerCase() === identity.email) {
      await markCustomerVerified(pg, customer.id, "seller")
    }
    return { ok: true, customer_id: customer.id } as const
  })
}

/** A shopper's session, the same as signing in would give. */
export function shopperToken(container: any, authIdentityId: string, customerId: string): string {
  const { http } = (container.resolve(ContainerRegistrationKeys.CONFIG_MODULE) as any).projectConfig
  return generateJwtToken(
    {
      actor_id: customerId,
      actor_type: "customer",
      auth_identity_id: authIdentityId,
      app_metadata: { customer_id: customerId },
      user_metadata: {},
    },
    { secret: http.jwtSecret as string, expiresIn: http.jwtExpiresIn ?? "1d", jwtOptions: http.jwtOptions }
  )
}
