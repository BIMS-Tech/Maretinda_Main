import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createInventoryLevelsWorkflow, updateInventoryLevelsWorkflow } from "@medusajs/medusa/core-flows"
import { primaryLocationId } from "./delivery-setup"
import { lowStockThreshold } from "./low-stock"

/**
 * A shop's stock, one row per variant, as a seller thinks of it: how many are
 * on hand at the pickup location, how many are already sold and waiting to
 * ship, and how many buyers can still order. Quantities are saved in one go.
 */

export type StockRow = {
  variant_id: string
  product_id: string
  product_title: string
  variant_title: string | null
  sku: string | null
  thumbnail: string | null
  status: string
  /** On hand at the pickup location; null when stock was never entered there. */
  on_hand: number | null
  reserved: number
  /** On hand everywhere minus reserved everywhere: what buyers can still order. */
  available: number
  /** Stock kept at the shop's other locations. */
  elsewhere: number
  /** "unlimited" variants aren't tracked; "bundle" ones are made of several items. */
  kind: "tracked" | "unlimited" | "bundle"
}

export type StockFilter = "all" | "unset" | "low" | "out"

const rowsFor = async (pg: any, sellerId: string, locationId: string | null, variantIds?: string[]): Promise<StockRow[]> => {
  const rows = await pg("seller_seller_product_product as sp")
    .join("product as p", "p.id", "sp.product_id")
    .join("product_variant as v", "v.product_id", "p.id")
    .leftJoin("product_variant_inventory_item as vi", function (this: any) {
      this.on("vi.variant_id", "v.id").andOnNull("vi.deleted_at")
    })
    .leftJoin("inventory_level as il", function (this: any) {
      this.on("il.inventory_item_id", "vi.inventory_item_id").andOnNull("il.deleted_at")
    })
    .where("sp.seller_id", sellerId)
    .whereNull("sp.deleted_at")
    .whereNull("p.deleted_at")
    .whereNull("v.deleted_at")
    .modify((q: any) => variantIds && q.whereIn("v.id", variantIds))
    .groupBy("v.id", "p.id")
    .orderBy([{ column: "p.title" }, { column: "p.id" }, { column: "v.variant_rank" }, { column: "v.title" }])
    .select(
      "v.id as variant_id",
      "p.id as product_id",
      "p.title as product_title",
      "v.title as variant_title",
      "v.sku",
      "p.thumbnail",
      "p.status",
      "v.manage_inventory",
      pg.raw("count(distinct vi.inventory_item_id) as items"),
      pg.raw("sum(il.stocked_quantity) filter (where il.location_id = ?) as on_hand", [locationId ?? ""]),
      pg.raw("coalesce(sum(il.stocked_quantity) filter (where il.location_id <> ?), 0) as elsewhere", [locationId ?? ""]),
      pg.raw("coalesce(sum(il.reserved_quantity), 0) as reserved"),
      pg.raw("coalesce(sum(il.stocked_quantity - il.reserved_quantity), 0) as available")
    )
  return rows.map((r: any) => ({
    variant_id: r.variant_id,
    product_id: r.product_id,
    product_title: r.product_title,
    variant_title: r.variant_title,
    sku: r.sku,
    thumbnail: r.thumbnail,
    status: r.status,
    on_hand: r.on_hand === null ? null : Number(r.on_hand),
    reserved: Number(r.reserved),
    available: Number(r.available),
    elsewhere: Number(r.elsewhere),
    kind: !r.manage_inventory ? "unlimited" : Number(r.items) > 1 ? "bundle" : "tracked",
  }))
}

const inFilter = (filter: StockFilter, low: number) => (r: StockRow) => {
  if (filter === "all") return true
  if (r.kind === "unlimited") return false
  if (filter === "unset") return r.on_hand === null && r.elsewhere === 0
  if (filter === "out") return r.available <= 0
  return r.available > 0 && r.available <= low
}

export async function listStock(
  container: any,
  sellerId: string,
  opts: { q?: string; productId?: string; filter?: StockFilter; limit?: number; offset?: number } = {}
) {
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const locationId = await primaryLocationId(container, sellerId)
  const low = lowStockThreshold()
  const all = (await rowsFor(pg, sellerId, locationId)).filter((r) => !opts.productId || r.product_id === opts.productId)
  const counts = {
    all: all.length,
    unset: all.filter(inFilter("unset", low)).length,
    low: all.filter(inFilter("low", low)).length,
    out: all.filter(inFilter("out", low)).length,
  }
  const q = (opts.q ?? "").trim().toLowerCase()
  const matching = all
    .filter(inFilter(opts.filter ?? "all", low))
    .filter((r) => !q || [r.product_title, r.variant_title, r.sku].some((v) => String(v ?? "").toLowerCase().includes(q)))
  const offset = Math.max(0, opts.offset ?? 0)
  const limit = Math.min(Math.max(1, opts.limit ?? 50), 200)
  return { stock: matching.slice(offset, offset + limit), count: matching.length, counts, low_at: low, has_location: !!locationId }
}

export type StockUpdate = { variant_id: string; quantity: number }

const MAX_QUANTITY = 1_000_000

/** Checks what the panel sent. Returns the updates, or the message to show. */
export function parseStockUpdates(body: any): StockUpdate[] | string {
  const list = body?.updates
  if (!Array.isArray(list) || list.length === 0) return "Change at least one quantity first."
  if (list.length > 200) return "Save up to 200 quantities at a time."
  const seen = new Map<string, number>()
  for (const u of list) {
    const quantity = Number(u?.quantity)
    if (typeof u?.variant_id !== "string" || !u.variant_id) return "One of the items is missing."
    if (u?.quantity === "" || u?.quantity === null || !Number.isInteger(quantity) || quantity < 0 || quantity > MAX_QUANTITY) {
      return "Stock has to be a whole number of 0 or more."
    }
    seen.set(u.variant_id, quantity)
  }
  return [...seen].map(([variant_id, quantity]) => ({ variant_id, quantity }))
}

export const NO_PICKUP_LOCATION = "Set up your pickup location first (Shipping → Set up delivery). Stock is kept there."

/**
 * Saves how many are on hand at the pickup location. Units already sold and
 * waiting to ship are reserved there, so a quantity below them is refused by
 * name. All or nothing: one bad row saves none.
 */
export async function saveStock(container: any, sellerId: string, updates: StockUpdate[]): Promise<{ saved: number } | { error: string }> {
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const locationId = await primaryLocationId(container, sellerId)
  if (!locationId) return { error: NO_PICKUP_LOCATION }

  const ids = updates.map((u) => u.variant_id)
  const rows = new Map((await rowsFor(pg, sellerId, locationId, ids)).map((r) => [r.variant_id, r]))
  const links = await pg("product_variant_inventory_item").whereIn("variant_id", ids).whereNull("deleted_at").select("variant_id", "inventory_item_id")
  const itemOf = new Map<string, string>(links.map((l: any) => [l.variant_id, l.inventory_item_id]))
  const levels = await pg("inventory_level")
    .whereIn("inventory_item_id", [...itemOf.values()])
    .where("location_id", locationId)
    .whereNull("deleted_at")
    .select("id", "inventory_item_id", "reserved_quantity")
  const levelOf = new Map<string, any>(levels.map((l: any) => [l.inventory_item_id, l]))

  const create: any[] = []
  const update: any[] = []
  for (const u of updates) {
    const row = rows.get(u.variant_id)
    if (!row) return { error: "One of the items isn't in your shop." }
    const label = row.variant_title ? `${row.product_title} (${row.variant_title})` : row.product_title
    const itemId = itemOf.get(u.variant_id)
    if (row.kind === "unlimited") return { error: `${label} doesn't track stock, so buyers can always order it.` }
    if (row.kind === "bundle" || !itemId) return { error: `${label} is made of several stock items. Update those under Inventory.` }
    const level = levelOf.get(itemId)
    const reserved = Number(level?.reserved_quantity ?? 0)
    if (u.quantity < reserved) {
      return { error: `${label}: ${reserved} ${reserved === 1 ? "is" : "are"} already sold and waiting to ship, so stock can't go below ${reserved}.` }
    }
    const input = { inventory_item_id: itemId, location_id: locationId, stocked_quantity: u.quantity }
    if (level) update.push({ ...input, id: level.id })
    else create.push(input)
  }

  if (create.length) await createInventoryLevelsWorkflow(container).run({ input: { inventory_levels: create } })
  if (update.length) await updateInventoryLevelsWorkflow(container).run({ input: { updates: update } as any })

  // Refilled above the warning level: a later drop should warn again
  const low = lowStockThreshold()
  const refilled = (await rowsFor(pg, sellerId, locationId, ids)).filter((r) => r.available > low).map((r) => r.variant_id)
  if (refilled.length) await pg("low_stock_alert").whereIn("variant_id", refilled).delete()

  const events = container.resolve(Modules.EVENT_BUS)
  for (const id of new Set(itemOf.values())) {
    await events.emit({ name: "algolia.intermediate.inventory_item.changed", data: { id } }).catch(() => undefined)
  }
  return { saved: updates.length }
}
