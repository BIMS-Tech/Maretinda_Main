import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { BRAND_NAME } from "../lib/brand"
import { emailVerificationRequired, sendCustomerVerification } from "../lib/email-verification"

/** Resend provider template name - must match @mercurjs/resend emailTemplates key */
const BUYER_ACCOUNT_CREATED_TEMPLATE = "buyerAccountCreatedEmailTemplate"

export const FIRST_TIME_BUYERS_GROUP = "First Time Buyers"

export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const customerId = data.id
  const customerService = container.resolve(Modules.CUSTOMER)

  try {
    const customer = await customerService.retrieveCustomer(customerId)

    // Add customer to First Time Buyers group for WELCOME promo eligibility
    try {
      const groups = await customerService.listCustomerGroups({
        name: FIRST_TIME_BUYERS_GROUP,
      })

      let group = groups[0]
      if (!group) {
        const created = await customerService.createCustomerGroups([
          { name: FIRST_TIME_BUYERS_GROUP },
        ])
        group = created[0]
      }

      await customerService.addCustomerToGroup([
        { customer_id: customerId, customer_group_id: group.id },
      ])
      console.log(`👥 Added ${customer.email} to '${FIRST_TIME_BUYERS_GROUP}' group`)
    } catch (groupError) {
      console.error("⚠️ Failed to add customer to First Time Buyers group:", groupError)
    }

    // A new account gets one email: welcome plus the link to confirm the
    // address (needed before the first order). Google sign-ups, guests and
    // local development get the plain welcome.
    if (customer.has_account && emailVerificationRequired()) {
      try {
        if (await sendCustomerVerification(container, customerId, { welcome: true })) {
          console.log(`✉️ Welcome + confirm-email sent to ${customer.email}`)
          return
        }
      } catch (verifyError) {
        console.error("⚠️ Confirm-email failed, sending the plain welcome:", verifyError)
      }
    }

    const storeName = BRAND_NAME
    const storefrontUrl =
      process.env.STOREFRONT_URL ||
      process.env.STORE_URL ||
      "https://your-storefront.com"
    const userName =
      [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
      "Customer"

    const notificationService = container.resolve(Modules.NOTIFICATION)
    await notificationService.createNotifications({
      to: customer.email,
      channel: "email",
      template: BUYER_ACCOUNT_CREATED_TEMPLATE,
      content: {
        subject: `Welcome to ${storeName}, ${userName}!`,
      },
      data: {
        data: {
          user_name: userName,
          store_name: storeName,
          storefront_url: storefrontUrl,
        },
      },
    })
    console.log(`✉️ Welcome email sent to ${customer.email}`)
  } catch (error) {
    console.error(
      "❌ customer.created handler failed:",
      error instanceof Error ? error.message : error
    )
  }
}

export const config: SubscriberConfig = {
  event: "customer.created",
}
