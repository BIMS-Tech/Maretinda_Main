import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateShippingOptionsWorkflow,
  updateStockLocationsWorkflow,
} from "@medusajs/medusa/core-flows"
import { createLocationFulfillmentSetAndAssociateWithSellerWorkflow } from "@mercurjs/b2c-core/workflows/fulfillment-set/create-location-fulfillment-set-and-associate-with-seller"
import { createVendorServiceZonesWorkflow } from "@mercurjs/b2c-core/workflows/fulfillment-set/create-vendor-service-zone"
import { recalculateOnboardingWorkflow } from "@mercurjs/b2c-core/workflows/seller/workflows/recalculate-onboarding"
import { withFreeShippingPrice } from "./free-shipping"
import { ensureReturnOption } from "./return-option"
import { uniqueZoneName } from "./unique-zone-name"

/**
 * Everything a shop needs before a buyer can check out with its products: a
 * pickup location that sells through the store, a delivery area covering the
 * Philippines, and at least one delivery option with a fee. In the locations
 * screens that is seven separate steps across four pages, and missing any one
 * leaves checkout saying "No shipping methods available". The guided setup in
 * the seller panel asks three questions and does all of it here.
 */

const PROVIDER = "manual_manual"
const COUNTRY = "ph"

export const DELIVERY_OPTIONS = {
  standard: { name: "Standard Delivery", description: "3–7 days" },
  express: { name: "Express Delivery", description: "1–3 days" },
} as const

export type DeliveryCode = keyof typeof DELIVERY_OPTIONS

export type PickupInput = {
  name: string
  address_1: string
  address_2?: string | null
  city: string
  province: string
  postal_code: string
  phone: string
}

export type DeliveryInput = {
  pickup: PickupInput
  /** Peso fee per option; leave one out (or null) not to offer it. Standard is required. */
  fees: Partial<Record<DeliveryCode, number | null>>
}

export type DeliveryOption = { id: string; name: string; code: string | null; fee: number | null }

export type DeliveryStatus = {
  location: (PickupInput & { id: string }) | null
  options: DeliveryOption[]
  /** What still keeps a buyer from checking out, in plain words. Empty when delivery works. */
  missing: string[]
  ready: boolean
}

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "")

/** Checks what the guided setup sent. Returns the cleaned input, or the message to show. */
export function parseDeliveryInput(body: any): DeliveryInput | string {
  const p = body?.pickup ?? {}
  const pickup: PickupInput = {
    name: text(p.name).slice(0, 100),
    address_1: text(p.address_1).slice(0, 200),
    address_2: text(p.address_2).slice(0, 120) || null,
    city: text(p.city).slice(0, 100),
    province: text(p.province).slice(0, 100),
    postal_code: text(p.postal_code),
    phone: text(p.phone).slice(0, 30),
  }
  if (!pickup.name) return "Give your pickup location a name, for example Main store."
  if (!pickup.address_1 || !pickup.city || !pickup.province) return "Enter the full pickup address, including city and province."
  if (!/^\d{4}$/.test(pickup.postal_code)) return "Enter the 4-digit ZIP code of the pickup address."
  if (pickup.phone.replace(/\D/g, "").length < 10) return "Enter a phone number the courier can call at pickup."

  const fees: DeliveryInput["fees"] = {}
  for (const code of Object.keys(DELIVERY_OPTIONS) as DeliveryCode[]) {
    const raw = body?.fees?.[code]
    if (raw === undefined || raw === null || raw === "") {
      fees[code] = null
      continue
    }
    const fee = Number(raw)
    if (!Number.isFinite(fee) || fee < 0 || fee > 10_000) return `Enter a ${DELIVERY_OPTIONS[code].name.toLowerCase()} fee between ₱0 and ₱10,000.`
    fees[code] = Math.round(fee * 100) / 100
  }
  if (fees.standard === null || fees.standard === undefined) return "Enter your standard delivery fee. Use 0 if you ship for free."
  return { pickup, fees }
}

const LOCATION_FIELDS = [
  "id",
  "name",
  "created_at",
  "address.*",
  "sales_channels.id",
  "fulfillment_providers.id",
  "fulfillment_sets.id",
  "fulfillment_sets.type",
  "fulfillment_sets.service_zones.id",
  "fulfillment_sets.service_zones.geo_zones.country_code",
  "fulfillment_sets.service_zones.geo_zones.type",
  "fulfillment_sets.service_zones.shipping_options.id",
  "fulfillment_sets.service_zones.shipping_options.name",
  "fulfillment_sets.service_zones.shipping_options.type.code",
  "fulfillment_sets.service_zones.shipping_options.rules.attribute",
  "fulfillment_sets.service_zones.shipping_options.rules.value",
]

const ruleIs = (o: any, attribute: string, value: string) =>
  (o.rules ?? []).some((r: any) => r.attribute === attribute && String(r.value) === value)

/** Offered to buyers at checkout: not a return label, and switched on in the store. */
const isDeliveryOption = (o: any) => !ruleIs(o, "is_return", "true") && !ruleIs(o, "enabled_in_store", "false")

const shippingSet = (l: any) => (l.fulfillment_sets ?? []).find((s: any) => s.type === "shipping")
const phZone = (set: any) =>
  (set?.service_zones ?? []).find((z: any) => (z.geo_zones ?? []).some((g: any) => g.type === "country" && g.country_code === COUNTRY))
const deliveryOptions = (l: any) =>
  (l.fulfillment_sets ?? [])
    .filter((s: any) => s.type === "shipping")
    .flatMap((s: any) => s.service_zones ?? [])
    .flatMap((z: any) => z.shipping_options ?? [])
    .filter(isDeliveryOption)

async function sellerLocations(container: any, sellerId: string): Promise<any[]> {
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const ids: string[] = await pg("seller_seller_stock_location_stock_location")
    .where("seller_id", sellerId)
    .whereNull("deleted_at")
    .pluck("stock_location_id")
  if (!ids.length) return []
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "stock_location", fields: LOCATION_FIELDS, filters: { id: ids } })
  return data
}

/** The location the guided setup works on: the one closest to finished, else the oldest. */
function primaryLocation(locations: any[]): any | null {
  const score = (l: any) =>
    (deliveryOptions(l).length ? 8 : 0) + (phZone(shippingSet(l)) ? 4 : 0) + (shippingSet(l) ? 2 : 0) + ((l.sales_channels ?? []).length ? 1 : 0)
  return (
    [...locations].sort((a, b) => score(b) - score(a) || new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0] ?? null
  )
}

export async function primaryLocationId(container: any, sellerId: string): Promise<string | null> {
  return primaryLocation(await sellerLocations(container, sellerId))?.id ?? null
}

async function feesOf(pg: any, optionIds: string[]): Promise<Map<string, number>> {
  if (!optionIds.length) return new Map()
  // The plain peso price, not the conditional "free over ₱499" one beside it
  const rows = await pg("shipping_option_price_set as l")
    .join("price as p", "p.price_set_id", "l.price_set_id")
    .whereIn("l.shipping_option_id", optionIds)
    .whereNull("l.deleted_at")
    .whereNull("p.deleted_at")
    .whereNull("p.price_list_id")
    .where("p.currency_code", "php")
    .where("p.rules_count", 0)
    .select("l.shipping_option_id", "p.amount")
  return new Map(rows.map((r: any) => [r.shipping_option_id, Number(r.amount)]))
}

const missingOf = (l: any | null, optionCount: number): string[] => {
  if (!l) return ["pickup location", "delivery fee"]
  const missing: string[] = []
  if (!l.address?.address_1) missing.push("pickup address")
  if (!(l.sales_channels ?? []).length || !(l.fulfillment_providers ?? []).length) missing.push("pickup location")
  if (!phZone(shippingSet(l))) missing.push("delivery area")
  if (!optionCount) missing.push("delivery fee")
  return missing
}

export async function deliveryStatus(container: any, sellerId: string): Promise<DeliveryStatus> {
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const location = primaryLocation(await sellerLocations(container, sellerId))
  const raw = location ? deliveryOptions(location) : []
  const fees = await feesOf(pg, raw.map((o: any) => o.id))
  const options: DeliveryOption[] = raw.map((o: any) => ({
    id: o.id,
    name: o.name,
    code: o.type?.code ?? null,
    fee: fees.get(o.id) ?? null,
  }))
  const missing = [...new Set(missingOf(location, options.filter((o) => o.fee !== null).length))]
  const a = location?.address
  return {
    location: location
      ? {
          id: location.id,
          name: location.name,
          address_1: a?.address_1 ?? "",
          address_2: a?.address_2 ?? null,
          city: a?.city ?? "",
          province: a?.province ?? "",
          postal_code: a?.postal_code ?? "",
          phone: a?.phone ?? "",
        }
      : null,
    options,
    missing,
    ready: missing.length === 0,
  }
}

/**
 * Whether buyers can check out with this shop's products, as one quick query:
 * publishing asks this, so it can't walk every location's details.
 */
export async function deliveryReady(pg: any, sellerId: string): Promise<boolean> {
  const row = await pg("seller_seller_stock_location_stock_location as sl")
    .join("sales_channel_stock_location as sc", "sc.stock_location_id", "sl.stock_location_id")
    .join("location_fulfillment_provider as fp", "fp.stock_location_id", "sl.stock_location_id")
    .join("location_fulfillment_set as lf", "lf.stock_location_id", "sl.stock_location_id")
    .join("fulfillment_set as fs", "fs.id", "lf.fulfillment_set_id")
    .join("service_zone as z", "z.fulfillment_set_id", "fs.id")
    .join("geo_zone as g", "g.service_zone_id", "z.id")
    .join("shipping_option as so", "so.service_zone_id", "z.id")
    .where("sl.seller_id", sellerId)
    .where("fs.type", "shipping")
    .where("g.country_code", COUNTRY)
    .whereNull("sl.deleted_at")
    .whereNull("sc.deleted_at")
    .whereNull("fp.deleted_at")
    .whereNull("lf.deleted_at")
    .whereNull("fs.deleted_at")
    .whereNull("z.deleted_at")
    .whereNull("g.deleted_at")
    .whereNull("so.deleted_at")
    .whereNotExists(function (this: any) {
      this.select(pg.raw("1"))
        .from("shipping_option_rule as r")
        .whereRaw("r.shipping_option_id = so.id")
        .whereNull("r.deleted_at")
        .whereRaw(`((r.attribute = 'is_return' AND r.value = '"true"') OR (r.attribute = 'enabled_in_store' AND r.value = '"false"'))`)
    })
    .first("so.id")
  return !!row
}

export const DELIVERY_MISSING = "pickup location and delivery fee"

async function storeSalesChannelId(pg: any): Promise<string | null> {
  const store = await pg("store").whereNull("deleted_at").whereNotNull("default_sales_channel_id").first("default_sales_channel_id")
  if (store) return store.default_sales_channel_id
  const channel = await pg("sales_channel").whereNull("deleted_at").where("is_disabled", false).orderBy("created_at").first("id")
  return channel?.id ?? null
}

/** The profile the shop's own products use; delivery options must share it or checkout won't offer them. */
async function sellerShippingProfileId(pg: any, sellerId: string): Promise<string | null> {
  const linked = await pg("seller_seller_fulfillment_shipping_profile as l")
    .join("shipping_profile as p", "p.id", "l.shipping_profile_id")
    .where("l.seller_id", sellerId)
    .whereNull("l.deleted_at")
    .whereNull("p.deleted_at")
    .orderBy("p.created_at")
    .first("p.id")
  if (linked) return linked.id
  const fallback = await pg("shipping_profile").whereNull("deleted_at").where("type", "default").orderBy("created_at").first("id")
  return fallback?.id ?? null
}

/** Does every delivery step for the shop. Running it again updates the address and fees instead of adding more. */
export async function setUpDelivery(
  container: any,
  seller: { id: string; name: string; handle: string },
  input: DeliveryInput
): Promise<DeliveryStatus> {
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const events = container.resolve(Modules.EVENT_BUS)
  const { pickup, fees } = input
  const address = {
    address_1: pickup.address_1,
    address_2: pickup.address_2 ?? undefined,
    city: pickup.city,
    province: pickup.province,
    postal_code: pickup.postal_code,
    country_code: COUNTRY,
    phone: pickup.phone,
  }

  // 1. The pickup location
  let location = primaryLocation(await sellerLocations(container, seller.id))
  if (location) {
    await updateStockLocationsWorkflow(container).run({
      input: { selector: { id: location.id }, update: { name: pickup.name, address } },
    })
  } else {
    const { result } = await createStockLocationsWorkflow(container).run({ input: { locations: [{ name: pickup.name, address }] } })
    await link.create({ seller: { seller_id: seller.id }, [Modules.STOCK_LOCATION]: { stock_location_id: result[0].id } })
    location = { ...result[0], sales_channels: [], fulfillment_providers: [], fulfillment_sets: [] }
  }

  // 2. It sells through the store, and the shop (or a courier it books) delivers
  const channelId = await storeSalesChannelId(pg)
  if (channelId && !(location.sales_channels ?? []).some((c: any) => c.id === channelId)) {
    await linkSalesChannelsToStockLocationWorkflow(container).run({ input: { id: location.id, add: [channelId], remove: [] } })
  }
  if (!(location.fulfillment_providers ?? []).some((p: any) => p.id === PROVIDER)) {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: PROVIDER },
    })
  }

  // 3. A delivery area covering the Philippines
  let set = shippingSet(location)
  if (!set) {
    const name = await uniqueZoneName(pg, "fulfillment_set", `${seller.name} delivery`, seller.handle)
    await createLocationFulfillmentSetAndAssociateWithSellerWorkflow(container).run({
      input: { location_id: location.id, fulfillment_set_data: { name, type: "shipping" }, seller_id: seller.id },
    } as any)
    set = shippingSet((await sellerLocations(container, seller.id)).find((l) => l.id === location.id))
  }
  let zone = phZone(set)
  if (!zone) {
    const name = await uniqueZoneName(pg, "service_zone", "Philippines", seller.handle)
    const { result } = await createVendorServiceZonesWorkflow(container).run({
      input: {
        data: [{ fulfillment_set_id: set.id, name, geo_zones: [{ type: "country", country_code: COUNTRY }] }],
        seller_id: seller.id,
      },
    } as any)
    zone = { ...(result as any)[0], shipping_options: [] }
  }

  // 4. The delivery options and their fees
  const profileId = await sellerShippingProfileId(pg, seller.id)
  if (!profileId) throw new Error("No shipping profile is set up for this shop")
  // Including ones switched off earlier, so offering it again doesn't add a second
  const existing = ((zone.shipping_options ?? []) as any[]).filter((o) => !ruleIs(o, "is_return", "true"))
  const touched: string[] = []
  for (const code of Object.keys(DELIVERY_OPTIONS) as DeliveryCode[]) {
    const fee = fees[code]
    const current = existing.find((o) => o.type?.code === code)
    const prices = fee === null || fee === undefined ? [] : withFreeShippingPrice([{ currency_code: "php", amount: fee }])
    const rules = [
      { attribute: "enabled_in_store", operator: "eq" as const, value: fee === null || fee === undefined ? "false" : "true" },
      { attribute: "is_return", operator: "eq" as const, value: "false" },
    ]
    if (fee === null || fee === undefined) {
      // Not offered any more: switch it off rather than delete it, past orders still point at it
      if (current) {
        await updateShippingOptionsWorkflow(container).run({ input: [{ id: current.id, rules: await rulesUpdate(pg, current.id, rules) }] as any })
        touched.push(current.id)
      }
      continue
    }
    if (current) {
      await updateShippingOptionsWorkflow(container).run({
        input: [{ id: current.id, price_type: "flat", prices, rules: await rulesUpdate(pg, current.id, rules) }] as any,
      })
      touched.push(current.id)
      continue
    }
    const { result } = await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: DELIVERY_OPTIONS[code].name,
          service_zone_id: zone.id,
          shipping_profile_id: profileId,
          provider_id: PROVIDER,
          price_type: "flat",
          data: { id: "manual-fulfillment" },
          type: { label: DELIVERY_OPTIONS[code].name, description: DELIVERY_OPTIONS[code].description, code },
          prices,
          rules,
        },
      ] as any,
    })
    await link.create({ seller: { seller_id: seller.id }, [Modules.FULFILLMENT]: { shipping_option_id: result[0].id } })
    touched.push(result[0].id)
    // Before the event below, whose subscriber would add a second one
    await ensureReturnOption(container, result[0].id)
  }

  await recalculateOnboardingWorkflow(container).run({ input: seller.id } as any)
  for (const id of touched) await events.emit({ name: "algolia.intermediate.shipping_option.changed", data: { id } }).catch(() => undefined)
  return deliveryStatus(container, seller.id)
}

/** Medusa adds rules sent without an id, so an update has to name the ones it replaces. */
async function rulesUpdate(pg: any, optionId: string, rules: { attribute: string; operator: "eq"; value: string }[]) {
  const current = await pg("shipping_option_rule").where("shipping_option_id", optionId).whereNull("deleted_at").select("id", "attribute")
  return rules.map((r) => {
    const match = current.find((c: any) => c.attribute === r.attribute)
    return match ? { ...r, id: match.id } : r
  })
}
