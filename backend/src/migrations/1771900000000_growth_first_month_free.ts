import { Migration } from "@mikro-orm/migrations"

/**
 * Owner's decision (28 November 2026): the first month is free on Growth only.
 * Starter and Premium are paid from the first day. Trials already running keep
 * the end date they started with; this only changes what new sign-ups get.
 *
 * Also: the AI seller agent is a Premium feature, coming soon, rather than a
 * separate Enterprise offer. `ai_agent` is shown on the plan cards.
 *
 * Plans are matched by id or by name, since an admin can rename a plan.
 */
export class Migration1771900000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      UPDATE "subscription_plan" SET "trial_days" = 30, "updated_at" = now()
      WHERE "id" = 'subplan_boost' OR "name" = 'Growth';
    `)
    this.addSql(`
      UPDATE "subscription_plan" SET "trial_days" = 0, "updated_at" = now()
      WHERE "id" IN ('subplan_foundation', 'subplan_managed') OR "name" IN ('Starter', 'Premium');
    `)
    this.addSql(`
      UPDATE "subscription_plan"
      SET "features" = COALESCE("features", '{}'::jsonb) || '{"ai_agent": "coming_soon"}'::jsonb, "updated_at" = now()
      WHERE "id" = 'subplan_managed' OR "name" = 'Premium';
    `)
  }

  async down(): Promise<void> {
    this.addSql(`
      UPDATE "subscription_plan" SET "trial_days" = 30, "updated_at" = now()
      WHERE "id" IN ('subplan_foundation', 'subplan_managed') OR "name" IN ('Starter', 'Premium');
    `)
    this.addSql(`
      UPDATE "subscription_plan" SET "features" = "features" - 'ai_agent', "updated_at" = now()
      WHERE "features" ? 'ai_agent';
    `)
  }
}
