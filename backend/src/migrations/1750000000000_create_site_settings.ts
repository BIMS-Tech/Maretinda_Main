import { Migration } from "@mikro-orm/migrations"

export class Migration1750000000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `)

    this.addSql(`
      INSERT INTO site_settings (key, value) VALUES
        ('hero', '{
          "heading": "Shop the Philippines. All in one place.",
          "subheading": "From fresh palengke produce to fashion-forward finds — discover thousands of trusted local sellers, with fast nationwide delivery and cash on delivery available.",
          "badge": "New season · Pampanga local",
          "featured_product_name": "Filipiniana Sundress",
          "featured_product_category": "Fashion · Summer Drop",
          "featured_product_price": 89900,
          "featured_product_original_price": 129900,
          "featured_product_rating_count": 248,
          "featured_product_sold_this_week": 247,
          "featured_product_link": "/categories",
          "featured_product_image": "/images/featured-products/fashion.png",
          "sellers_count": "12,800+"
        }')
      ON CONFLICT (key) DO NOTHING;
    `)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS site_settings;`)
  }
}
