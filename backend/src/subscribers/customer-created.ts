import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

/**
 * Custom subscriber to handle customer.created event
 * This overrides the broken subscriber from @mercurjs/resend
 */
export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const customerId = data.id
    
    console.log(`✅ Customer created successfully: ${customerId}`)

    // Get customer data
    const customerService = container.resolve(Modules.CUSTOMER)
    const customer = await customerService.retrieveCustomer(customerId)

    // Get store data
    const storeService = container.resolve(Modules.STORE)
    const stores = await storeService.listStores()
    const store = stores[0]

    console.log(`📧 Would send welcome email to: ${customer.email}`)
    console.log(`🏪 Store: ${store?.name || 'Maretinda Marketplace'}`)

    // Optional: Send notification through the notification module
    try {
      const notificationService = container.resolve(Modules.NOTIFICATION)
      
      await notificationService.createNotifications({
        to: customer.email,
        channel: 'email',
        template: 'customer-created',
        data: {
          customer_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email,
          customer_email: customer.email,
          store_name: store?.name || 'Maretinda Marketplace',
        },
      })
      
      console.log(`✉️ Welcome notification queued for ${customer.email}`)
    } catch (notificationError) {
      // Notification is optional, don't fail if it errors
      console.warn('⚠️ Could not send welcome notification:', notificationError.message)
    }
  } catch (error) {
    console.error('❌ Error in customer.created subscriber:', error)
    // Don't throw - we don't want to fail the customer creation process
  }
}

export const config: SubscriberConfig = {
  event: "customer.created",
}


