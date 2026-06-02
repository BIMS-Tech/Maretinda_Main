import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateSiteSettings1750000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)

    await queryRunner.query(`
      INSERT INTO site_settings (key, value) VALUES
        ('hero', '{
          "heading": "Shop the Philippines. All in one place.",
          "subheading": "From fresh palengke produce to fashion-forward finds — discover thousands of trusted local vendors, with fast nationwide delivery and cash on delivery available.",
          "badge": "New season · Pampanga local",
          "featured_product_name": "Filipiniana Sundress",
          "featured_product_category": "Fashion · Summer Drop",
          "featured_product_price": 89900,
          "featured_product_original_price": 129900,
          "featured_product_rating_count": 248,
          "featured_product_sold_this_week": 247,
          "featured_product_link": "/categories",
          "featured_product_image": "/images/featured-products/fashion.png",
          "vendors_count": "12,800+"
        }')
      ON CONFLICT (key) DO NOTHING
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS site_settings`)
  }
}
