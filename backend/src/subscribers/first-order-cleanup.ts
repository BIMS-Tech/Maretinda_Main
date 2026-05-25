import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { FIRST_TIME_BUYERS_GROUP } from "./customer-created"

/**
 * After a customer places their first order, remove them from the
 * "First Time Buyers" group so the WELCOME promo cannot be reused.
 */
export default async function firstOrderCleanupHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const orderId = data.id
    const orderService = container.resolve(Modules.ORDER)
    const order = await orderService.retrieveOrder(orderId)

    if (!order.customer_id) return

    const customerService = container.resolve(Modules.CUSTOMER)

    // Count this customer's orders — if this is their first, clean up group
    const [, orderCount] = await orderService.listAndCountOrders({
      customer_id: order.customer_id,
    })

    if (orderCount !== 1) return

    const groups = await customerService.listCustomerGroups({
      name: FIRST_TIME_BUYERS_GROUP,
    })
    const group = groups[0]
    if (!group) return

    await customerService.removeCustomerFromGroup([
      { customer_id: order.customer_id, customer_group_id: group.id },
    ])

    console.log(
      `🎯 Removed customer ${order.customer_id} from '${FIRST_TIME_BUYERS_GROUP}' after first order`
    )
  } catch (error) {
    console.error(
      "⚠️ first-order-cleanup subscriber failed:",
      error instanceof Error ? error.message : error
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
