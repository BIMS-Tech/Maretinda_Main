import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * When a new seller is approved/created, automatically link all platform
 * customer groups to them so they appear in the vendor panel promotion
 * condition picker (controlled by seller_seller_customer_customer_group).
 */
export default async function sellerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const sellerId = data.id
  if (!sellerId) return

  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  try {
    const groups = await knex.raw(
      `SELECT id FROM customer_group WHERE deleted_at IS NULL`
    )

    if (!groups.rows.length) return

    const rows = groups.rows.map((g: any) => ({
      sellerId,
      groupId: g.id,
    }))

    for (const { sellerId: sid, groupId } of rows) {
      await knex.raw(
        `INSERT INTO seller_seller_customer_customer_group (id, seller_id, customer_group_id)
         VALUES (gen_random_uuid(), ?, ?)
         ON CONFLICT (seller_id, customer_group_id) DO NOTHING`,
        [sid, groupId]
      )
    }

    console.info(`[SellerCreated] Linked ${rows.length} customer groups to seller ${sellerId}`)
  } catch (err: any) {
    console.error(`[SellerCreated] Failed to link customer groups: ${err.message}`)
  }
}

export const config: SubscriberConfig = {
  event: "seller.created",
}
