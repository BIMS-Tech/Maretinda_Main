import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import { ResendNotificationTemplates } from '@mercurjs/resend'

import { Hosts, buildHostAddress } from '../shared/infra/http/utils'

export default async function sellerCancelOrderHandler({
  event,
  container
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [order]
  } = await query.graph({
    entity: 'order',
    fields: [
      'id',
      'email',
      'display_id',
      'items.*',
      'customer.first_name',
      'customer.last_name',
    ],
    filters: {
      id: event.data.id
    }
  })

  if (!order) {
    console.error('Order not found:', event.data.id)
    return
  }

  // Skip seller notification since seller data is not available due to SQL constraints
  console.log('Skipping seller cancel notification for order:', order.id, '- seller data not available')
  return

  await notificationService.createNotifications({
    to: 'placeholder@example.com', // order.seller.email not available
    channel: 'email',
    template: ResendNotificationTemplates.SELLER_CANCELED_ORDER,
    content: {
      subject: `Your order #${order.display_id} has been canceled`
    },
    data: {
      data: {
        order: {
          id: order.id,
          display_id: order.display_id,
          item: order.items
        },
        order_address: buildHostAddress(
          Hosts.VENDOR_PANEL,
          `/orders/${order.id}`
        ).toString()
      }
    }
  })
}

export const config: SubscriberConfig = {
  event: 'order.canceled',
  context: {
    subscriberId: 'notification-seller-cancel-order'
  }
}
