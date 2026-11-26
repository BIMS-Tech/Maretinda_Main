import { Migration } from "@mikro-orm/migrations"

/**
 * The return, refund and cancellation process (policy proposal of November
 * 2026): a case beside each return request with its proof, deadlines and
 * stage; refunds (buyer_refund: Medusa has its own "refund") Maretinda's accounting team pays by hand and logs with
 * proof; what sellers owe back after a refund, recovered from their next
 * payout or their security deposit; buyers' cancellation requests for paid
 * orders; and the six eligible return reasons (no "change of mind").
 */
export class Migration1771100000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "return_case" (
        "request_id"       text        NOT NULL,
        "order_id"         text        NOT NULL,
        "seller_id"        text        NOT NULL,
        "customer_id"      text        NOT NULL,
        "payment"          text        NOT NULL,
        "reasons"          jsonb       NOT NULL DEFAULT '[]'::jsonb,
        "evidence"         jsonb       NOT NULL DEFAULT '[]'::jsonb,
        "seller_evidence"  jsonb       NOT NULL DEFAULT '[]'::jsonb,
        "payout_enc"       text        NULL,
        "payout_label"     text        NULL,
        "stage"            text        NOT NULL DEFAULT 'seller_review',
        "resolution"       text        NULL,
        "fault"            text        NULL,
        "respond_by"       timestamptz NOT NULL,
        "approved_at"      timestamptz NULL,
        "approved_by"      text        NULL,
        "ship_back_by"     timestamptz NULL,
        "return_instructions" text     NULL,
        "return_courier"   text        NULL,
        "return_tracking"  text        NULL,
        "return_shipping"  numeric     NULL,
        "shipped_back_at"  timestamptz NULL,
        "received_at"      timestamptz NULL,
        "inspect_by"       timestamptz NULL,
        "seller_note"      text        NULL,
        "buyer_note"       text        NULL,
        "escalated_at"     timestamptz NULL,
        "escalated_by"     text        NULL,
        "decide_by"        timestamptz NULL,
        "decision_note"    text        NULL,
        "closed_at"        timestamptz NULL,
        "created_at"       timestamptz NOT NULL DEFAULT now(),
        "updated_at"       timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "return_case_pkey" PRIMARY KEY ("request_id"),
        CONSTRAINT "return_case_stage_check" CHECK ("stage" IN
          ('seller_review', 'declined', 'escalated', 'awaiting_return', 'in_transit', 'inspecting', 'refund_due', 'refunded', 'closed'))
      );
    `)
    this.addSql(`CREATE INDEX IF NOT EXISTS "return_case_seller_idx" ON "return_case" ("seller_id", "stage");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "return_case_customer_idx" ON "return_case" ("customer_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "return_case_order_idx" ON "return_case" ("order_id");`)

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "return_evidence" (
        "id"          text        NOT NULL,
        "owner_type"  text        NOT NULL,
        "owner_id"    text        NOT NULL,
        "kind"        text        NOT NULL,
        "request_id"  text        NULL,
        "created_at"  timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "return_evidence_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "return_evidence_kind_check" CHECK ("kind" IN ('photo', 'video'))
      );
    `)

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "buyer_refund" (
        "id"              text        NOT NULL,
        "kind"            text        NOT NULL,
        "order_id"        text        NOT NULL,
        "seller_id"       text        NOT NULL,
        "customer_id"     text        NULL,
        "request_id"      text        NULL,
        "payment"         text        NOT NULL,
        "fault"           text        NOT NULL,
        "amount"          numeric     NOT NULL,
        "refunded"        jsonb       NOT NULL DEFAULT '[]'::jsonb,
        "deductions"      jsonb       NOT NULL DEFAULT '[]'::jsonb,
        "seller_charges"  jsonb       NOT NULL DEFAULT '[]'::jsonb,
        "status"          text        NOT NULL DEFAULT 'due',
        "due_by"          timestamptz NOT NULL,
        "payout_enc"      text        NULL,
        "payout_label"    text        NULL,
        "paid_at"         timestamptz NULL,
        "paid_amount"     numeric     NULL,
        "paid_method"     text        NULL,
        "reference"       text        NULL,
        "receipt_id"      text        NULL,
        "paid_by"         text        NULL,
        "note"            text        NULL,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "buyer_refund_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "buyer_refund_status_check" CHECK ("status" IN ('due', 'paid', 'void')),
        CONSTRAINT "buyer_refund_kind_check" CHECK ("kind" IN ('return', 'cancellation', 'failed_delivery'))
      );
    `)
    this.addSql(`CREATE INDEX IF NOT EXISTS "buyer_refund_order_idx" ON "buyer_refund" ("order_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "buyer_refund_status_idx" ON "buyer_refund" ("status", "due_by");`)
    // One live refund per return request
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "buyer_refund_request_key" ON "buyer_refund" ("request_id") WHERE "request_id" IS NOT NULL AND "status" <> 'void';`)

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "seller_charge" (
        "id"          text        NOT NULL,
        "seller_id"   text        NOT NULL,
        "order_id"    text        NULL,
        "refund_id"   text        NULL,
        "label"       text        NOT NULL,
        "amount"      numeric     NOT NULL,
        "waived_at"   timestamptz NULL,
        "created_at"  timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "seller_charge_pkey" PRIMARY KEY ("id")
      );
    `)
    this.addSql(`CREATE INDEX IF NOT EXISTS "seller_charge_seller_idx" ON "seller_charge" ("seller_id");`)
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "seller_charge_recovery" (
        "id"          text        NOT NULL,
        "charge_id"   text        NOT NULL,
        "source"      text        NOT NULL,
        "source_id"   text        NOT NULL,
        "amount"      numeric     NOT NULL,
        "created_at"  timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "seller_charge_recovery_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "seller_charge_recovery_source_check" CHECK ("source" IN ('payout', 'deposit', 'cod'))
      );
    `)
    this.addSql(`CREATE INDEX IF NOT EXISTS "seller_charge_recovery_charge_idx" ON "seller_charge_recovery" ("charge_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "seller_charge_recovery_source_idx" ON "seller_charge_recovery" ("source", "source_id");`)

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "seller_deposit_entry" (
        "id"          text        NOT NULL,
        "seller_id"   text        NOT NULL,
        "kind"        text        NOT NULL,
        "amount"      numeric     NOT NULL,
        "charge_id"   text        NULL,
        "reference"   text        NULL,
        "note"        text        NULL,
        "created_by"  text        NULL,
        "created_at"  timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "seller_deposit_entry_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "seller_deposit_entry_kind_check" CHECK ("kind" IN ('received', 'deducted', 'returned'))
      );
    `)
    this.addSql(`CREATE INDEX IF NOT EXISTS "seller_deposit_entry_seller_idx" ON "seller_deposit_entry" ("seller_id");`)

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "cancellation_request" (
        "id"            text        NOT NULL,
        "order_id"      text        NOT NULL,
        "seller_id"     text        NOT NULL,
        "customer_id"   text        NOT NULL,
        "reason"        text        NOT NULL,
        "payout_enc"    text        NULL,
        "payout_label"  text        NULL,
        "status"        text        NOT NULL DEFAULT 'pending',
        "decided_by"    text        NULL,
        "decided_at"    timestamptz NULL,
        "decision_note" text        NULL,
        "refund_id"     text        NULL,
        "created_at"    timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "cancellation_request_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "cancellation_request_status_check" CHECK ("status" IN ('pending', 'approved', 'rejected'))
      );
    `)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "cancellation_request_open_key" ON "cancellation_request" ("order_id") WHERE "status" = 'pending';`)

    // Return-to-sender deliveries, for the repeat-COD restriction
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "failed_delivery" (
        "order_id"     text        NOT NULL,
        "customer_id"  text        NULL,
        "email"        text        NULL,
        "payment"      text        NOT NULL,
        "rts_fee"      numeric     NULL,
        "recorded_by"  text        NULL,
        "created_at"   timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "failed_delivery_pkey" PRIMARY KEY ("order_id")
      );
    `)

    // The policy's eligible reasons; others (like a change of mind) can't be picked any more
    const reasons: [string, string, string][] = [
      ["damaged-defective", "Damaged or defective", "Arrived broken, not working, or with a hidden defect"],
      ["wrong-item", "Wrong item delivered", "A different product, size, colour or variation from what was ordered"],
      ["incomplete", "Incomplete order", "Parts, accessories or items from the order are missing"],
      ["not-as-described", "Not as described, or counterfeit", "Materially different from the listing, or proven counterfeit"],
      ["expired", "Expired goods", "Food or consumables that arrived past their expiry date"],
      ["not-received", "Not received, or lost in transit", "The courier marked it lost, or it never arrived"],
    ]
    for (const [value, label, description] of reasons) {
      this.addSql(`
        INSERT INTO "return_reason" ("id", "value", "label", "description", "created_at", "updated_at")
        SELECT 'rr_maretinda_${value.replace(/-/g, "_")}', '${value}', '${label.replace(/'/g, "''")}', '${description.replace(/'/g, "''")}', now(), now()
        WHERE NOT EXISTS (SELECT 1 FROM "return_reason" WHERE "value" = '${value}' AND "deleted_at" IS NULL);
      `)
    }
    this.addSql(`
      UPDATE "return_reason" SET "deleted_at" = now()
       WHERE "deleted_at" IS NULL
         AND "value" NOT IN (${reasons.map(([v]) => `'${v}'`).join(", ")});
    `)
  }

  async down(): Promise<void> {
    for (const t of ["failed_delivery", "cancellation_request", "seller_deposit_entry", "seller_charge_recovery", "seller_charge", "buyer_refund", "return_evidence", "return_case"]) {
      this.addSql(`DROP TABLE IF EXISTS "${t}";`)
    }
  }
}
