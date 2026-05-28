import { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("seller_application", (t) => {
    t.text("id").primary()
    t.timestamp("submitted_at", { useTz: true }).notNullable().defaultTo(knex.fn.now())

    // Step 1 — Merchant contact
    t.text("first_name").notNullable()
    t.text("last_name").notNullable()
    t.text("complete_address").notNullable()
    t.text("mobile_number").notNullable()
    t.text("email").notNullable()
    t.text("designation").nullable()
    t.date("target_go_live").nullable()

    // Step 2 — Business info
    t.text("business_name").notNullable()
    t.text("business_address").notNullable()
    t.text("business_landline").nullable()
    t.text("business_mobile").nullable()
    t.text("business_email").nullable()
    t.text("business_tin").nullable()
    t.text("form_of_organization").notNullable()   // Government|Transportation|Others|SoleProprietorship|Corporation|Partnership|Cooperative|Association
    t.text("merchant_category").nullable()
    t.text("business_activity").nullable()

    // Step 3 — Authorized signatory (Corp/Partnership/etc.)
    t.text("signatory_first_name").nullable()
    t.text("signatory_middle_name").nullable()
    t.text("signatory_last_name").nullable()
    t.text("signatory_email").nullable()
    t.text("signatory_landline").nullable()
    t.text("signatory_mobile").nullable()

    // Step 6 — GiyaPay config
    t.text("merchant_trade_name").nullable()
    t.text("charge_to").nullable()               // Merchant|Payor
    t.text("gateway_account_type").nullable()    // Universal|Individual
    t.text("pay_button_type").nullable()         // StandardGiyaPayButton|GatewayDirect
    t.specificType("selected_gateways", "text[]").nullable()

    // Step 7 — Features
    t.boolean("payment_links_feature").nullable()
    t.boolean("editable_amount_feature").nullable()
    t.text("minimum_amount_type").nullable()      // AmountDue|OtherAmount|NA
    t.text("minimum_amount_value").nullable()

    // Step 8 — Transactions
    t.text("estimated_monthly_hits").nullable()
    t.text("estimated_amount_per_transaction").nullable()

    // Step 9 — Bank details
    t.text("beneficiary_bank").nullable()
    t.text("bank_address").nullable()
    t.text("bank_account_name").nullable()
    t.text("bank_account_number").nullable()
    t.text("settlement_type").nullable()          // Standard|OnDemand

    // Step 10 — Branding
    t.text("brand_colors").nullable()

    // Step 11 — Digital support
    t.specificType("digital_support", "text[]").nullable()
    t.boolean("has_marketing_budget").nullable()

    // Document URLs (stored after GCS upload)
    t.jsonb("documents").nullable()              // { board_resolution: url, ... }

    // Status
    t.text("status").notNullable().defaultTo("pending")   // pending|approved|rejected
    t.text("admin_notes").nullable()
    t.text("seller_id").nullable()               // linked after approval
    t.timestamp("reviewed_at", { useTz: true }).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("seller_application")
}
