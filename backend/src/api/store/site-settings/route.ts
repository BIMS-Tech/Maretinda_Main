import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/site-settings?key=hero
 * Public read-only endpoint. Returns a single settings row by key.
 * The hero row contains all editable copy for the storefront hero card.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const key = (req.query.key as string) || "hero"

  try {
    const knex = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const row = await knex.raw(
      `SELECT key, value, updated_at FROM site_settings WHERE key = ? LIMIT 1`,
      [key]
    )

    if (row.rows.length === 0) {
      return res.status(404).json({ message: "Setting not found" })
    }

    res.status(200).json({ key: row.rows[0].key, value: row.rows[0].value, updated_at: row.rows[0].updated_at })
  } catch (error: any) {
    console.error("[Store Site Settings] GET error:", error.message)
    res.status(500).json({ message: "Failed to retrieve site settings", error: error.message })
  }
}
