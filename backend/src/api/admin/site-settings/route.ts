import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /admin/site-settings?key=hero
 * Returns current value of a settings key.
 *
 * PUT /admin/site-settings
 * Body: { key: string, value: Record<string, any> }
 * Upserts the settings row and returns the saved value.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const key = (req.query.key as string) || "hero"

  try {
    const knex = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

    // Ensure table exists before querying (idempotent)
    await knex.raw(`
      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)

    const row = await knex.raw(
      `SELECT key, value, updated_at FROM site_settings WHERE key = ? LIMIT 1`,
      [key]
    )

    if (row.rows.length === 0) {
      return res.status(404).json({ message: "Setting not found" })
    }

    res.status(200).json({ key: row.rows[0].key, value: row.rows[0].value, updated_at: row.rows[0].updated_at })
  } catch (error: any) {
    console.error("[Admin Site Settings] GET error:", error.message)
    res.status(500).json({ message: "Failed to retrieve site settings", error: error.message })
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const { key, value } = req.body as { key: string; value: Record<string, any> }

  if (!key || typeof value !== "object") {
    return res.status(400).json({ message: "key and value are required" })
  }

  try {
    const knex = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

    await knex.raw(`
      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)

    const result = await knex.raw(
      `INSERT INTO site_settings (key, value, updated_at)
       VALUES (?, ?::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
       RETURNING key, value, updated_at`,
      [key, JSON.stringify(value)]
    )

    res.status(200).json({ key: result.rows[0].key, value: result.rows[0].value, updated_at: result.rows[0].updated_at })
  } catch (error: any) {
    console.error("[Admin Site Settings] PUT error:", error.message)
    res.status(500).json({ message: "Failed to save site settings", error: error.message })
  }
}
