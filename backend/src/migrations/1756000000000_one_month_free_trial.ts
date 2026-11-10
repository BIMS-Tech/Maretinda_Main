import { Migration } from "@mikro-orm/migrations"

/**
 * The first month is free: the onboarding chat, the website and the support
 * assistant all say so, but the plans granted 7 days. Moves plans still on the
 * old 7-day default to 30; a length an admin changed by hand is left alone.
 * Trials already running keep the end date they started with.
 */
export class Migration1756000000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`UPDATE "subscription_plan" SET "trial_days" = 30, "updated_at" = now() WHERE "trial_days" = 7;`)
  }

  async down(): Promise<void> {
    this.addSql(`UPDATE "subscription_plan" SET "trial_days" = 7, "updated_at" = now() WHERE "trial_days" = 30;`)
  }
}
