import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

/**
 * Custom subscriber to handle order.placed event for seller notifications
 * This overrides the broken subscriber from @mercurjs/resend
 */
export default async function orderPlacedSellerHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const orderId = data.id
    
    console.log(`🔔 Notifying seller about new order: ${orderId}`)

    // Get order data
    const orderService = container.resolve(Modules.ORDER)
    const order = await orderService.retrieveOrder(orderId, {
      relations: ["items", "items.product", "shipping_address", "billing_address"]
    })

    // Get store data
    const storeService = container.resolve(Modules.STORE)
    const stores = await storeService.listStores()
    const store = stores[0]

    // Try to identify the seller/vendor from order items
    // In a marketplace, we need to find which sellers' products are in this order
    const productIds = order.items?.map((item: any) => item.product_id).filter(Boolean) || []
    
    if (productIds.length > 0) {
      try {
        // Query to find sellers for these products
        const { ContainerRegistrationKeys } = await import("@medusajs/framework/utils")
        const pgConnection = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
        
        const sellerQuery = `
          SELECT DISTINCT s.id, s.name, s.email
          FROM seller s
          JOIN seller_seller_product_product ssp ON ssp.seller_id = s.id
          WHERE ssp.product_id = ANY($1::text[])
        `
        
        const result = await pgConnection.raw(sellerQuery, [productIds])
        const sellers = result?.rows || result || []

        console.log(`📧 Found ${sellers.length} seller(s) to notify`)

        // Notify each seller
        for (const seller of sellers) {
          console.log(`📧 Would send new order notification to seller: ${seller.name} (${seller.email || 'no email'})`)
          console.log(`🏪 Store: ${store?.name || 'Maretinda Marketplace'}`)
          console.log(`📦 Order ID: ${order.display_id}`)

          if (seller.email) {
            // Optional: Send notification through the notification module
            try {
              const notificationService = container.resolve(Modules.NOTIFICATION)
              
              await notificationService.createNotifications({
                to: seller.email,
                channel: 'email',
                template: 'order-placed-seller',
                data: {
                  seller_name: seller.name,
                  seller_email: seller.email,
                  store_name: store?.name || 'Maretinda Marketplace',
                  order_id: order.display_id,
                  order_date: order.created_at,
                  order_total: order.total,
                  currency: order.currency_code,
                  customer_email: order.email,
                },
              })
              
              console.log(`✉️ New order notification queued for seller: ${seller.name}`)
            } catch (notificationError) {
              // Notification is optional, don't fail if it errors
              console.warn(`⚠️ Could not send notification to seller ${seller.name}:`, notificationError.message)
            }
          } else {
            console.warn(`⚠️ Seller ${seller.name} has no email address`)
          }
        }
      } catch (dbError) {
        console.error('❌ Error querying sellers:', dbError)
      }
    } else {
      console.warn('⚠️ No product IDs found in order items')
    }
  } catch (error) {
    console.error('❌ Error in order.placed seller subscriber:', error)
    // Don't throw - we don't want to fail the order process
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}

