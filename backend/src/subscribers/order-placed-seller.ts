import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/** Resend provider template - must match @mercurjs/resend emailTemplates key */
const SELLER_NEW_ORDER_TEMPLATE = "sellerNewOrderEmailTemplate"

const storefrontUrl = () =>
  process.env.STOREFRONT_URL ||
  process.env.STORE_URL ||
  "https://your-storefront.com"

/** Get distinct sellers for given product IDs. Uses Query API first, falls back to raw SQL if needed. */
async function getSellersForProductIds(
  container: any,
  productIds: string[]
): Promise<{ id: string; name: string; email: string }[]> {
  if (productIds.length === 0) return []

  // Try Query API (entity "product" with seller relation - depends on b2c link)
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "seller.id", "seller.name", "seller.email"],
      filters: { id: productIds },
    })
    if (products?.length) {
      const seen = new Set<string>()
      const sellers: { id: string; name: string; email: string }[] = []
      for (const p of products) {
        const s = (p as any).seller
        if (s?.id && !seen.has(s.id)) {
          seen.add(s.id)
          if (s.email) sellers.push({ id: s.id, name: s.name ?? "Seller", email: s.email })
        }
      }
      if (sellers.length) return sellers
    }
  } catch (_) {
    // Fall through to raw SQL
  }

  // Fallback: raw SQL (PG_CONNECTION may be Knex; in subscriber context it can throw or have different API)
  let pgConnection: any
  try {
    pgConnection = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  } catch (_) {
    return []
  }
  if (!pgConnection?.raw) return []

  try {
    const placeholders = productIds.map(() => "?").join(",")
    const result = await pgConnection.raw(
      `SELECT DISTINCT s.id, s.name, s.email FROM seller s
       JOIN seller_seller_product_product ssp ON ssp.seller_id = s.id
       WHERE ssp.product_id IN (${placeholders})`,
      productIds
    )
    const rows = result?.rows ?? result ?? []
    return rows.filter((r: any) => r?.email).map((r: any) => ({
      id: r.id,
      name: r.name ?? "Seller",
      email: r.email,
    }))
  } catch (_) {
    return []
  }
}

export default async function orderPlacedSellerHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const orderId = data.id
    const orderService = container.resolve(Modules.ORDER)
    const order = await orderService.retrieveOrder(orderId, {
      relations: ["items", "items.product", "shipping_address", "billing_address"],
    })

    const storeService = container.resolve(Modules.STORE)
    const stores = await storeService.listStores()
    const store = stores[0]
    const storeName = store?.name || "Maretinda Marketplace"
    const baseUrl = storefrontUrl()

    const productIds = (order as any).items?.map((i: any) => i.product_id).filter(Boolean) || []
    if (productIds.length === 0) {
      console.warn("⚠️ No product IDs in order:", orderId)
      return
    }

    const sellers = await getSellersForProductIds(container, productIds)

    let customerFirstName = ""
    let customerLastName = ""
    if ((order as any).customer_id) {
      try {
        const customer = await container.resolve(Modules.CUSTOMER).retrieveCustomer((order as any).customer_id)
        customerFirstName = customer.first_name ?? ""
        customerLastName = customer.last_name ?? ""
      } catch (_) {}
    }

    const items = (order as any).items || []
    const orderForTemplate = {
      id: order.id,
      display_id: (order as any).display_id ?? order.id,
      seller: { name: "", email: "" },
      customer: { first_name: customerFirstName, last_name: customerLastName },
      items: items.map((item: any) => ({
        id: item.id,
        thumbnail: item.thumbnail || "",
        product_title: item.title ?? item.product_title ?? "Product",
        variant_title: item.variant_title ?? "",
        unit_price: item.unit_price ?? 0,
        quantity: item.quantity ?? 1,
      })),
    }

    const notificationService = container.resolve(Modules.NOTIFICATION)

    for (const seller of sellers) {
      if (!seller.email) {
        console.warn(`⚠️ Seller ${seller.name} has no email`)
        continue
      }
      orderForTemplate.seller = { name: seller.name ?? "Seller", email: seller.email }

      try {
        await notificationService.createNotifications({
          to: seller.email,
          channel: "email",
          template: SELLER_NEW_ORDER_TEMPLATE,
          content: {
            subject: `New order #${orderForTemplate.display_id} received`,
          },
          data: {
            data: {
              order: orderForTemplate,
              store_name: storeName,
              storefront_url: baseUrl,
            },
          },
        })
        console.log(`✉️ New order email sent to seller: ${seller.name}`)
      } catch (err) {
        console.error(
          `❌ Seller order email failed for ${seller.name}:`,
          err instanceof Error ? err.message : err
        )
      }
    }
  } catch (error) {
    console.error(
      "❌ order.placed seller subscriber:",
      error instanceof Error ? error.message : error
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
