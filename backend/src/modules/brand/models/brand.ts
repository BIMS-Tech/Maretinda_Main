import { model } from '@medusajs/framework/utils'

/**
 * Brand — a platform/admin-curated catalog entry that products can be assigned to.
 * Products link to a brand via the product↔brand module link (see src/links).
 */
export const Brand = model.define('brand', {
  id: model.id().primaryKey(),
  name: model.text().searchable(),
  slug: model.text().nullable(),
  logo_url: model.text().nullable(),
  description: model.text().nullable(),
  is_active: model.boolean().default(true),
})
