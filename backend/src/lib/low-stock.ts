import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sellerPanelUrl, sendNotice } from "./notify"

/** At or below this many units a variant counts as running low. */
export const lowStockThreshold = () => {
  const n = Number(process.env.LOW_STOCK_THRESHOLD)
  return Number.isFinite(n) && n >= 0 ? n : 5
}

export type VariantStock = {
  variant_id: string
  variant_title: string | null
  sku: string | null
  product_id: string
  product_title: string
  available: number
  seller_id: string | null
  seller_name: string | null
  seller_email: string | null
}

/**
 * Units a buyer could still order: stocked minus reserved (placed orders hold
 * a reservation until they ship) across all locations, divided by how many
 * inventory units one variant uses. Only variants that track inventory.
 */
export async function stockOfVariants(pg: any, variantIds: string[]): Promise<VariantStock[]> {
  if (!variantIds.length) return []
  const rows = await pg("product_variant as v")
    .join("product as p", "p.id", "v.product_id")
    .join("product_variant_inventory_item as vi", "vi.variant_id", "v.id")
    .leftJoin("inventory_level as il", function (this: any) {
      this.on("il.inventory_item_id", "vi.inventory_item_id").andOnNull("il.deleted_at")
    })
    .leftJoin("seller_seller_product_product as sp", function (this: any) {
      this.on("sp.product_id", "p.id").andOnNull("sp.deleted_at")
    })
    .leftJoin("seller as s", "s.id", "sp.seller_id")
    .whereIn("v.id", variantIds)
    .where("v.manage_inventory", true)
    .whereNull("v.deleted_at")
    .whereNull("vi.deleted_at")
    .groupBy("v.id", "p.id", "vi.inventory_item_id", "vi.required_quantity", "s.id")
    .select(
      "v.id as variant_id",
      "v.title as variant_title",
      "v.sku",
      "p.id as product_id",
      "p.title as product_title",
      "vi.required_quantity",
      "s.id as seller_id",
      "s.name as seller_name",
      "s.email as seller_email",
      pg.raw("coalesce(sum(il.stocked_quantity - il.reserved_quantity), 0) as units")
    )

  const byVariant = new Map<string, VariantStock>()
  for (const r of rows) {
    const per = Math.max(1, Number(r.required_quantity) || 1)
    const available = Math.floor(Number(r.units) / per)
    const seen = byVariant.get(r.variant_id)
    // A variant made of several inventory items is limited by the scarcest one
    if (seen) seen.available = Math.min(seen.available, available)
    else
      byVariant.set(r.variant_id, {
        variant_id: r.variant_id,
        variant_title: r.variant_title,
        sku: r.sku,
        product_id: r.product_id,
        product_title: r.product_title,
        available,
        seller_id: r.seller_id,
        seller_name: r.seller_name,
        seller_email: r.seller_email,
      })
  }
  return [...byVariant.values()]
}

const label = (v: VariantStock) => {
  const variant = v.variant_title && !/^default( (variant|title))?$/i.test(v.variant_title) ? ` (${v.variant_title})` : ""
  return `${v.product_title}${variant}`
}

export function lowStockEmail(items: (VariantStock & { level: "low" | "out" })[]) {
  const out = items.filter((i) => i.level === "out").length
  const subject =
    items.length === 1
      ? `${items[0].level === "out" ? "Out of stock" : "Running low"}: ${label(items[0])}`
      : out === items.length
        ? `${items.length} of your products are out of stock`
        : `${items.length} of your products are running low`
  return {
    subject,
    heading: out ? "Some of your stock has run out" : "Some of your stock is running low",
    paragraphs: [
      ...items.map((i) => `${label(i)}${i.sku ? ` · SKU ${i.sku}` : ""}: ${i.level === "out" ? "out of stock" : `${i.available} left`}`),
      out
        ? "Buyers can't order items that are out of stock. Update your stock in the seller panel once you have more."
        : "Update your stock in the seller panel when you restock, so buyers can keep ordering.",
    ],
  }
}

/**
 * After an order: warns each shop once when a variant it sells drops to the
 * threshold, and once more when it runs out. Restocking above the threshold
 * re-arms the warning. Returns what was sent (for tests and logs).
 */
export async function alertLowStock(container: any, orderIds: string[]) {
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  if (!orderIds.length) return []
  const lines = await pg("order_item as oi")
    .join("order_line_item as li", "li.id", "oi.item_id")
    .whereIn("oi.order_id", orderIds)
    .whereNotNull("li.variant_id")
    .distinct("li.variant_id")
  return alertLowStockForVariants(container, lines.map((l: any) => l.variant_id))
}

export async function alertLowStockForVariants(container: any, variantIds: string[]) {
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const stocks = await stockOfVariants(pg, variantIds)
  const threshold = lowStockThreshold()

  const due: (VariantStock & { level: "low" | "out" })[] = []
  for (const s of stocks) {
    const level = s.available <= 0 ? "out" : s.available <= threshold ? "low" : null
    if (!level) {
      await pg("low_stock_alert").where("variant_id", s.variant_id).delete()
      continue
    }
    // Restocked a little after running out: back to "low" quietly, so running out again is news
    if (level === "low") await pg("low_stock_alert").where({ variant_id: s.variant_id, level: "out" }).update({ level: "low", available: s.available })
    // One alert per level, even when two orders finish at once
    const { rows } = await pg.raw(
      `INSERT INTO low_stock_alert (variant_id, level, available, notified_at) VALUES (?, ?, ?, now())
       ON CONFLICT (variant_id) DO UPDATE SET level = EXCLUDED.level, available = EXCLUDED.available, notified_at = now()
       WHERE low_stock_alert.level = 'low' AND EXCLUDED.level = 'out'
       RETURNING variant_id`,
      [s.variant_id, level, s.available]
    )
    if (rows.length) due.push({ ...s, level })
  }

  const bySeller = new Map<string, typeof due>()
  for (const d of due) {
    if (!d.seller_email) continue
    bySeller.set(d.seller_email, [...(bySeller.get(d.seller_email) ?? []), d])
  }
  for (const [email, items] of bySeller) {
    const e = lowStockEmail(items)
    const one = new Set(items.map((i) => i.product_id)).size === 1
    await sendNotice(container, {
      to: email,
      subject: e.subject,
      eyebrow: "Stock",
      heading: e.heading,
      user_name: items[0].seller_name,
      paragraphs: e.paragraphs,
      button: {
        label: "Update stock",
        url: one ? `${sellerPanelUrl()}/products/${items[0].product_id}` : `${sellerPanelUrl()}/inventory`,
      },
      note: `We warn you at ${lowStockThreshold()} units or fewer, and again when an item runs out.`,
    })
  }
  return due
}
