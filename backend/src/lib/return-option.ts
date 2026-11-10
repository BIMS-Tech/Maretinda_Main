import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createShippingOptionsWorkflow } from "@medusajs/medusa/core-flows"

type ZoneOption = { service_zone_id: string; shipping_profile_id: string; provider_id: string }

/**
 * The free return option every seller zone needs: without one a buyer's
 * return request stops at "No shipping methods available". Only manual
 * delivery gets one; courier providers arrange returns themselves.
 */
export function returnOptionInput(option: ZoneOption, sellerName: string) {
  if (option.provider_id !== "manual_manual") return null
  return {
    name: `Return to ${sellerName}`,
    service_zone_id: option.service_zone_id,
    shipping_profile_id: option.shipping_profile_id,
    provider_id: option.provider_id,
    price_type: "flat" as const,
    data: { id: "manual-fulfillment-return", is_return: true },
    type: { label: "Return", description: "The buyer sends the item back to the seller", code: "return" },
    prices: [{ currency_code: "php", amount: 0 }],
    rules: [
      { attribute: "is_return", operator: "eq" as const, value: "true" },
      { attribute: "enabled_in_store", operator: "eq" as const, value: "true" },
    ],
  }
}

const isReturnRule = (r: { attribute: string; value: unknown }) => r.attribute === "is_return" && String(r.value) === "true"

/**
 * Makes sure the zone of this seller delivery option has a return option,
 * creating and linking one to the seller when it doesn't. Returns the new
 * option's id, or null when nothing was needed.
 */
export async function ensureReturnOption(container: any, shippingOptionId: string): Promise<string | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const { data: [option] } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "service_zone_id", "shipping_profile_id", "provider_id", "rules.attribute", "rules.value"],
    filters: { id: shippingOptionId },
  })
  if (!option || (option.rules ?? []).some(isReturnRule)) return null

  const { data: zoneOptions } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "rules.attribute", "rules.value"],
    filters: { service_zone_id: option.service_zone_id },
  })
  if (zoneOptions.some((o: any) => (o.rules ?? []).some(isReturnRule))) return null

  const link = await pg("seller_seller_fulfillment_shipping_option")
    .where("shipping_option_id", shippingOptionId)
    .whereNull("deleted_at")
    .first("seller_id")
  if (!link) return null
  const seller = await pg("seller").where("id", link.seller_id).first("name")

  const input = returnOptionInput(option, seller?.name ?? "the seller")
  if (!input) return null

  const { result } = await createShippingOptionsWorkflow(container).run({ input: [input as any] })
  await container.resolve(ContainerRegistrationKeys.REMOTE_LINK).create({
    seller: { seller_id: link.seller_id },
    [Modules.FULFILLMENT]: { shipping_option_id: result[0].id },
  })
  return result[0].id
}
