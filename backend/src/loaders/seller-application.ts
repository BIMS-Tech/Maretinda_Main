import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Seller Application Loader
 * Creates the seller_application table on startup (idempotent), so a fresh
 * database gets it automatically without relying on `medusa db:migrate`
 * (the migration lives in src/migrations and is not picked up by db:migrate).
 *
 * Without this table the /store/seller-application insert fails, so the
 * multi-step registration only leaves behind the MercurJS auth `request`,
 * which the admin then shows as a "legacy" seller request.
 */
export default async function sellerApplicationLoader(container: MedusaContainer): Promise<void> {
  console.log("[Seller Application Loader] ========== INITIALIZING seller_application TABLE ==========")
  try {
    const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

    await pg.raw(`
      CREATE TABLE IF NOT EXISTS "seller_application" (
        "id"                          text        NOT NULL,
        "submitted_at"                timestamptz NOT NULL DEFAULT now(),

        -- Merchant contact
        "first_name"                  text        NOT NULL DEFAULT '',
        "last_name"                   text        NOT NULL DEFAULT '',
        "complete_address"            text        NOT NULL DEFAULT '',
        "mobile_number"               text        NOT NULL DEFAULT '',
        "email"                       text        NOT NULL DEFAULT '',
        "designation"                 text        NULL,
        "target_go_live"              text        NULL,

        -- Business info
        "business_name"               text        NOT NULL DEFAULT '',
        "business_address"            text        NOT NULL DEFAULT '',
        "business_landline"           text        NULL,
        "business_mobile"             text        NULL,
        "business_email"              text        NULL,
        "business_tin"                text        NULL,
        "form_of_organization"        text        NOT NULL DEFAULT '',
        "merchant_category"           text        NULL,
        "business_activity"           text        NULL,

        -- Authorized signatory (conditional)
        "signatory_first_name"        text        NULL,
        "signatory_middle_name"       text        NULL,
        "signatory_last_name"         text        NULL,
        "signatory_email"             text        NULL,
        "signatory_landline"          text        NULL,
        "signatory_mobile"            text        NULL,

        -- Legacy gateway fields (kept for backwards compatibility)
        "merchant_trade_name"         text        NULL,
        "charge_to"                   text        NULL,
        "gateway_account_type"        text        NULL,
        "pay_button_type"             text        NULL,
        "selected_gateways"           text[]      NULL,
        "payment_links_feature"       boolean     NULL,
        "editable_amount_feature"     boolean     NULL,
        "minimum_amount_type"         text        NULL,
        "minimum_amount_value"        text        NULL,
        "estimated_monthly_hits"      text        NULL,
        "estimated_amount_per_transaction" text   NULL,
        "beneficiary_bank"            text        NULL,
        "bank_address"                text        NULL,
        "bank_account_name"           text        NULL,
        "bank_account_number"         text        NULL,
        "settlement_type"             text        NULL,

        -- Branding & digital
        "brand_colors"                text        NULL,
        "digital_support"             text[]      NULL,
        "has_marketing_budget"        boolean     NULL,

        -- Promo / referral code entered at registration
        "promo_code"                  text        NULL,

        -- Document URLs (JSON object: { key: url })
        "documents"                   jsonb       NULL,

        -- Admin
        "status"                      text        NOT NULL DEFAULT 'pending',
        "admin_notes"                 text        NULL,
        "seller_id"                   text        NULL,
        "auth_identity_id"            text        NULL,
        "reviewed_at"                 timestamptz NULL,

        CONSTRAINT "seller_application_pkey" PRIMARY KEY ("id")
      );
    `)
    // Older installs may predate auth_identity_id (used to create the seller on approval)
    await pg.raw(`ALTER TABLE "seller_application" ADD COLUMN IF NOT EXISTS "auth_identity_id" text`)
    // Older installs may predate promo_code (entered during registration)
    await pg.raw(`ALTER TABLE "seller_application" ADD COLUMN IF NOT EXISTS "promo_code" text`)
    await pg.raw(`CREATE INDEX IF NOT EXISTS "seller_application_status_idx" ON "seller_application" ("status")`)
    await pg.raw(`CREATE INDEX IF NOT EXISTS "seller_application_email_idx" ON "seller_application" ("email")`)

    console.log("[Seller Application Loader] ========== seller_application TABLE READY ==========")
  } catch (error) {
    console.error("[Seller Application Loader] ========== FAILED ==========", error)
  }
}
