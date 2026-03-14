import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

/** Resend provider template - must match @mercurjs/resend emailTemplates key */
const BUYER_NEW_ORDER_TEMPLATE = "buyerNewOrderEmailTemplate"

const storefrontUrl = () =>
  process.env.STOREFRONT_URL ||
  process.env.STORE_URL ||
  "https://your-storefront.com"

export default async function orderPlacedBuyerHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const orderId = data.id
    const orderService = container.resolve(Modules.ORDER)
    const order = await orderService.retrieveOrder(orderId, {
      relations: ["items", "shipping_address", "billing_address", "shipping_methods"],
    })

    const emailTo = order.email || (order.customer_id ? (await container.resolve(Modules.CUSTOMER).retrieveCustomer(order.customer_id).catch(() => null))?.email : null)
    if (!emailTo) {
      console.warn("⚠️ No email for order confirmation:", orderId)
      return
    }

    const storeService = container.resolve(Modules.STORE)
    const stores = await storeService.listStores()
    const store = stores[0]
    const storeName = store?.name || "Maretinda Marketplace"
    const baseUrl = storefrontUrl()
    const orderAddress = `${baseUrl.replace(/\/$/, "")}/user/orders/${order.id}`

    let userName = "Customer"
    if (order.customer_id) {
      try {
        const customer = await container.resolve(Modules.CUSTOMER).retrieveCustomer(order.customer_id)
        userName = [customer.first_name, customer.last_name].filter(Boolean).join(" ") || customer.email || userName
      } catch (_) {}
    }

    const shippingMethods = (order as any).shipping_methods || []
    const shippingAddress = (order as any).shipping_address || {}
    const items = (order as any).items || []

    const orderForTemplate = {
      display_id: (order as any).display_id ?? order.id,
      total: (order as any).total ?? 0,
      currency_code: (order as any).currency_code ?? "USD",
      email: order.email,
      items: items.map((item: any) => ({
        thumbnail: item.thumbnail || "",
        product_title: item.title ?? item.product_title ?? "Product",
        variant_title: item.variant_title ?? "",
        unit_price: item.unit_price ?? 0,
        quantity: item.quantity ?? 1,
      })),
      shipping_methods: [
        {
          amount: shippingMethods[0]?.amount ?? 0,
          name: shippingMethods[0]?.name ?? "Standard",
        },
      ],
      shipping_address: {
        first_name: shippingAddress.first_name ?? "",
        last_name: shippingAddress.last_name ?? "",
        company: shippingAddress.company ?? "",
        address_1: shippingAddress.address_1 ?? "",
        address_2: shippingAddress.address_2 ?? "",
        postal_code: shippingAddress.postal_code ?? "",
        city: shippingAddress.city ?? "",
        province: shippingAddress.province ?? "",
        phone: shippingAddress.phone ?? "",
      },
    }

    const notificationService = container.resolve(Modules.NOTIFICATION)
    await notificationService.createNotifications({
      to: emailTo,
      channel: "email",
      template: BUYER_NEW_ORDER_TEMPLATE,
      content: {
        subject: `Order Confirmation - #${orderForTemplate.display_id}`,
      },
      data: {
        data: {
          user_name: userName,
          order_address: orderAddress,
          store_name: storeName,
          storefront_url: baseUrl,
          order: orderForTemplate,
        },
      },
    })
    console.log(`✉️ Order confirmation email sent to ${emailTo}`)
  } catch (error) {
    console.error(
      "❌ order.placed buyer email failed:",
      error instanceof Error ? error.message : error
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
