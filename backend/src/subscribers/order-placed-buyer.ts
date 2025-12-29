import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

/**
 * Custom subscriber to handle order.placed event for buyer notifications
 * This overrides the broken subscriber from @mercurjs/resend
 */
export default async function orderPlacedBuyerHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const orderId = data.id
    
    console.log(`✅ Order placed successfully: ${orderId}`)

    // Get order data
    const orderService = container.resolve(Modules.ORDER)
    const order = await orderService.retrieveOrder(orderId, {
      relations: ["items", "shipping_address", "billing_address"]
    })

    // Get customer data if available
    if (order.customer_id) {
      const customerService = container.resolve(Modules.CUSTOMER)
      const customer = await customerService.retrieveCustomer(order.customer_id)

      // Get store data
      const storeService = container.resolve(Modules.STORE)
      const stores = await storeService.listStores()
      const store = stores[0]

      console.log(`📧 Would send order confirmation email to buyer: ${customer.email || order.email}`)
      console.log(`🏪 Store: ${store?.name || 'Maretinda Marketplace'}`)
      console.log(`📦 Order ID: ${order.display_id}`)
      console.log(`💰 Total: ${order.total}`)

      // Optional: Send notification through the notification module
      try {
        const notificationService = container.resolve(Modules.NOTIFICATION)
        
        const emailTo = customer.email || order.email
        if (!emailTo) {
          console.warn('⚠️ No email address available for order confirmation')
          return
        }
        
        await notificationService.createNotifications({
          to: emailTo,
          channel: 'email',
          template: 'order-placed-buyer',
          data: {
            customer_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email,
            customer_email: customer.email || order.email,
            store_name: store?.name || 'Maretinda Marketplace',
            order_id: order.display_id,
            order_date: order.created_at,
            order_total: order.total,
            currency: order.currency_code,
          },
        })
        
        console.log(`✉️ Order confirmation notification queued for buyer`)
      } catch (notificationError) {
        // Notification is optional, don't fail if it errors
        console.warn('⚠️ Could not send order confirmation notification:', notificationError.message)
      }
    }
  } catch (error) {
    console.error('❌ Error in order.placed buyer subscriber:', error)
    // Don't throw - we don't want to fail the order process
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}

