import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

const PASSWORD_RESET_TEMPLATE = "passwordResetEmailTemplate"

export default async function authPasswordResetHandler({
  event: { data },
  container,
}: SubscriberArgs<{ entity_id: string; actor_type: string; token: string }>) {
  try {
    const { entity_id: email, actor_type, token } = data

    // Only handle customer password resets (not admin)
    if (actor_type !== "customer") return

    const storefrontUrl =
      process.env.STOREFRONT_URL ||
      process.env.STORE_URL ||
      "https://maretinda.com"

    const resetUrl = `${storefrontUrl.replace(/\/$/, "")}/reset-password?token=${token}&email=${encodeURIComponent(email)}`

    const storeService = container.resolve(Modules.STORE)
    const stores = await storeService.listStores()
    const storeName = stores[0]?.name || "Maretinda Marketplace"

    // Try to get user's name from customer service
    let userName = "Customer"
    try {
      const customerService = container.resolve(Modules.CUSTOMER)
      const customers = await customerService.listCustomers({ email })
      if (customers[0]) {
        userName = [customers[0].first_name, customers[0].last_name].filter(Boolean).join(" ") || userName
      }
    } catch (_) {}

    const notificationService = container.resolve(Modules.NOTIFICATION)
    await notificationService.createNotifications({
      to: email,
      channel: "email",
      template: PASSWORD_RESET_TEMPLATE,
      content: {
        subject: "Reset Your Password",
      },
      data: {
        data: {
          user_name: userName,
          store_name: storeName,
          reset_url: resetUrl,
        },
      },
    })

    console.log(`✉️ Password reset email sent to ${email}`)
  } catch (error) {
    console.error(
      "❌ auth.password_reset email failed:",
      error instanceof Error ? error.message : error
    )
  }
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
