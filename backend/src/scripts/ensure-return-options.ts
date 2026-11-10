import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ensureReturnOption } from "../lib/return-option"

/**
 * Gives every existing seller delivery zone its free return option (new zones
 * get one from the ensure-return-option subscriber). Safe to run again.
 *
 *   npx medusa exec ./src/scripts/ensure-return-options.ts
 */
export default async function ensureReturnOptions({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const links = await pg("seller_seller_fulfillment_shipping_option").whereNull("deleted_at").select("shipping_option_id")
  let added = 0
  for (const { shipping_option_id } of links) {
    const created = await ensureReturnOption(container, shipping_option_id)
    if (created) {
      added++
      logger.info(`Return option ${created} added beside ${shipping_option_id}`)
    }
  }
  logger.info(`Done: ${added} return option(s) added`)
}
