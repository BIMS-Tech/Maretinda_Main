import { Migration } from "@mikro-orm/migrations"

/**
 * The seller registration flow creates the applicant's auth identity first
 * (email + password) and stores its id on the application so that approving the
 * application can create + activate the seller account. The store route inserts
 * `auth_identity_id`, so the column must exist on seller_application.
 */
export class Migration1748450000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE "seller_application" ADD COLUMN IF NOT EXISTS "auth_identity_id" text NULL;`
    )
  }

  async down(): Promise<void> {
    this.addSql(
      `ALTER TABLE "seller_application" DROP COLUMN IF EXISTS "auth_identity_id";`
    )
  }
}
