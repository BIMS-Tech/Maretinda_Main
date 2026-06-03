import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * Run with: npx medusa exec src/scripts/link-customer-groups-to-sellers.ts
 *
 * Links all platform customer groups to all sellers via the Medusa remote link
 * service (the same mechanism mercurjs uses for rule-value-options lookups).
 */
export default async function linkCustomerGroupsToSellers({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const sellers = await knex.raw(
    `SELECT id FROM seller WHERE deleted_at IS NULL`
  )
  const groups = await knex.raw(
    `SELECT id FROM customer_group WHERE deleted_at IS NULL`
  )

  if (!sellers.rows.length) {
    logger.info("No sellers found.")
    return
  }
  if (!groups.rows.length) {
    logger.info("No customer groups found.")
    return
  }

  logger.info(`Linking ${groups.rows.length} groups to ${sellers.rows.length} sellers...`)

  for (const seller of sellers.rows) {
    for (const group of groups.rows) {
      try {
        await remoteLink.create([
          {
            [Modules.CUSTOMER]: { customer_group_id: group.id },
            // seller module key — matches mercurjs's seller module
            "seller": { seller_id: seller.id },
          },
        ])
      } catch (err: any) {
        // Ignore duplicate key errors
        if (!err.message?.includes("duplicate") && !err.message?.includes("conflict")) {
          logger.warn(`  seller=${seller.id} group=${group.id}: ${err.message}`)
        }
      }
    }
    logger.info(`  Linked seller ${seller.id}`)
  }

  logger.info("Done.")
}
