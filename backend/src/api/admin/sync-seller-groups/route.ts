import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * POST /admin/sync-seller-groups
 *
 * Links all platform customer groups to all sellers via Medusa's remote link
 * service so they appear in the vendor panel promotion condition picker.
 * Safe to call multiple times (skips existing links).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const remoteLink = req.scope.resolve(ContainerRegistrationKeys.REMOTE_LINK)
    const knex = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

    const sellers = await knex.raw(
      `SELECT id FROM seller WHERE deleted_at IS NULL`
    )
    const groups = await knex.raw(
      `SELECT id, name FROM customer_group WHERE deleted_at IS NULL`
    )

    if (!sellers.rows.length || !groups.rows.length) {
      return res.status(200).json({
        message: "Nothing to link.",
        sellers: sellers.rows.length,
        groups: groups.rows.length,
      })
    }

    const linked: string[] = []
    const skipped: string[] = []

    for (const seller of sellers.rows) {
      for (const group of groups.rows) {
        try {
          await remoteLink.create([
            {
              "customer": { customer_group_id: group.id },
              "seller": { seller_id: seller.id },
            },
          ])
          linked.push(`${seller.id}→${group.name}`)
        } catch (err: any) {
          skipped.push(`${seller.id}→${group.name}: ${err.message}`)
        }
      }
    }

    res.status(200).json({
      message: "Done.",
      linked: linked.length,
      skipped: skipped.length,
      details: { linked, skipped },
    })
  } catch (error: any) {
    console.error("[SyncSellerGroups] Error:", error.message)
    res.status(500).json({ message: error.message })
  }
}
