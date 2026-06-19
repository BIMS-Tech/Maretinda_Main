import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules, QueryContext } from "@medusajs/framework/utils"
import VoucherService from "../../../services/voucher"
import FlashSaleService from "../../../services/flash-sale"

/**
 * Effective + original price (in pesos) for a single variant. Prefers Medusa's
 * `calculated_price` (which respects seller/admin PRICE LISTS, sale windows and currency)
 * and falls back to the raw PHP base price when no calculated price is available.
 */
function variantPesos(variant: any): { effective: number; original: number } | null {
  const cp = variant?.calculated_price
  if (cp && typeof cp.calculated_amount === "number") {
    const effective = cp.calculated_amount
    const original = typeof cp.original_amount === "number" ? cp.original_amount : effective
    return { effective, original }
  }
  const php = (variant?.prices || [])
    .filter((p: any) => p.currency_code?.toLowerCase() === "php" && typeof p.amount === "number")
    .map((p: any) => p.amount as number)
  if (php.length === 0) return null
  const min = Math.min(...php)
  return { effective: min, original: min }
}

/**
 * Find an approved active flash-sale discount for a product. Returns null if the product
 * is not currently on flash sale. Kept defensive — if the flash_sale tables don't exist
 * (fresh env) we just treat the product as not on sale.
 */
async function getActiveFlashDiscount(
  req: MedusaRequest,
  productId: string
): Promise<{ discount_type: "percentage" | "fixed"; discount_value: number; variant_id: string | null } | null> {
  try {
    const service = new FlashSaleService(req.scope as any)
    const sale = await service.getActive()
    const item = sale?.items?.find((i) => i.product_id === productId)
    if (!item) return null
    return {
      discount_type: item.discount_type,
      discount_value: Number(item.discount_value),
      variant_id: item.variant_id ?? null,
    }
  } catch {
    return null
  }
}

async function resolveProductPrice(
  req: MedusaRequest,
  productLink: string | undefined
): Promise<{ featured_product_price?: number; featured_product_original_price?: number } | null> {
  if (!productLink) return null
  const match = productLink.match(/^\/products\/(.+)$/)
  if (!match) return null
  const handle = match[1]

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: products } = await (query as any).graph({
      entity: "product",
      fields: ["id", "handle", "variants.id", "variants.calculated_price.*", "variants.prices.*"],
      filters: { handle, status: "published" },
      // Anonymous PHP storefront context so seller/admin price lists are applied to
      // calculated_price (same context the store uses via region_id).
      context: {
        variants: { calculated_price: QueryContext({ currency_code: "php" }) },
      },
    })

    const product = products?.[0]
    if (!product?.variants?.length) return null

    const flash = await getActiveFlashDiscount(req, product.id)

    // Cheapest variant by effective (price-list-aware) price, matching the storefront's
    // getProductPrice. When the flash sale targets a specific variant, restrict to it.
    const priced = product.variants
      .filter((v: any) => !flash?.variant_id || v.id === flash.variant_id)
      .map((v: any) => variantPesos(v))
      .filter((p: any): p is { effective: number; original: number } => p !== null)
      .sort((a: any, b: any) => a.effective - b.effective)

    const cheapest = priced[0]
    if (!cheapest) return null

    // Medusa amounts are in major units (pesos); the hero's formatPrice divides by 100, so
    // convert to centavos.
    const toCentavos = (pesos: number) => Math.round(pesos * 100)

    let pricePesos = cheapest.effective
    // Price-list discount already baked into `effective`; show the list price as original.
    let originalPesos: number | null = cheapest.original > cheapest.effective ? cheapest.original : null

    if (flash) {
      // Layer the custom flash-sale discount on top of the (already price-list-aware) price,
      // mirroring FlashSaleSection's math. The pre-flash price becomes the struck-through original.
      const salePesos =
        flash.discount_type === "percentage"
          ? Math.round(pricePesos * (1 - flash.discount_value / 100))
          : Math.max(0, Math.round(pricePesos - flash.discount_value))
      originalPesos = pricePesos
      pricePesos = salePesos
    }

    return {
      featured_product_price: toCentavos(pricePesos),
      ...(originalPesos != null && originalPesos > pricePesos
        ? { featured_product_original_price: toCentavos(originalPesos) }
        : {}),
    }
  } catch (e) {
    console.error("[Hero Content] Failed to resolve product price:", (e as Error).message)
    return null
  }
}

/**
 * GET /store/hero-content
 *
 * welcome_promo — priority:
 *   1. Promotion whose code matches site_settings.hero.welcome_promo_code (admin-pinned)
 *   2. First active platform promotion (not seller-scoped)
 *
 * featured_campaign — priority:
 *   1. Campaign whose id matches site_settings.hero.featured_campaign_id (admin-pinned)
 *   2. First active campaign
 *
 * site_settings — hero row for editable copy (heading, product card, etc.)
 *
 * NOTE: Medusa v2's promotion and campaign tables have no metadata column.
 * Control is done entirely through site_settings.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const promotionService = req.scope.resolve(Modules.PROMOTION)
    const voucherService = new VoucherService(req.scope)
    const knex = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const now = new Date()

    // --- Load site_settings ---
    let site_settings: Record<string, any> = {}
    try {
      const row = await knex.raw(
        `SELECT value FROM site_settings WHERE key = 'hero' LIMIT 1`
      )
      if (row.rows.length > 0) site_settings = row.rows[0].value
    } catch {
      // table may not exist yet on first deploy
    }

    // The featured product price is NOT admin-overridable — it is always derived from the
    // live product (see resolveProductPrice below). Drop any price fields that may linger in
    // stored site_settings so a stale override can never leak onto the hero.
    delete site_settings.featured_product_price
    delete site_settings.featured_product_original_price

    // --- Welcome promo ---
    let welcome_promo: Record<string, any> | null = null
    const pinnedCode = site_settings.welcome_promo_code as string | undefined

    const allActive = await promotionService.listPromotions(
      { status: ["active"] },
      { take: 200, relations: ["application_method", "rules"] }
    ) as any[]

    const platformPromos = allActive.filter(
      (p) => !p.metadata?.seller_id && p.metadata?.scope !== "seller"
    )

    let welcomeRaw: any = null
    if (pinnedCode) {
      welcomeRaw = platformPromos.find((p) => p.code === pinnedCode) ?? null
    }
    if (!welcomeRaw) {
      // fall back: prefer fixed-amount promo, then any active platform promo
      welcomeRaw =
        platformPromos.find((p) => p.application_method?.type === "fixed") ??
        platformPromos[0] ??
        null
    }

    if (welcomeRaw) {
      welcome_promo = voucherService.formatPromotion(welcomeRaw)
    }

    // --- Featured campaign ---
    let featured_campaign: Record<string, any> | null = null
    const pinnedCampaignId = site_settings.featured_campaign_id as string | undefined

    const allCampaigns = await (promotionService as any).listCampaigns(
      {},
      { take: 50, relations: ["promotions"] }
    )

    const activeCampaigns = (allCampaigns || []).filter((c: any) => {
      if (c.ends_at && new Date(c.ends_at) < now) return false
      return true
    })

    let featuredRaw: any = null
    if (pinnedCampaignId) {
      featuredRaw = activeCampaigns.find((c: any) => c.id === pinnedCampaignId) ?? null
    }
    if (!featuredRaw) {
      featuredRaw = activeCampaigns[0] ?? null
    }

    if (featuredRaw) {
      featured_campaign = {
        id: featuredRaw.id,
        name: featuredRaw.name,
        description: featuredRaw.description || null,
        ends_at: featuredRaw.ends_at || null,
        badge_label: featuredRaw.metadata?.badge_label || null,
        discount_label: featuredRaw.metadata?.discount_label || null,
        shop_link: `/campaigns/${featuredRaw.id}`,
      }
    }

    // --- Featured product price from Medusa ---
    const resolvedPrice = await resolveProductPrice(req, site_settings.featured_product_link as string | undefined)
    if (resolvedPrice) {
      site_settings = { ...site_settings, ...resolvedPrice }
    }

    // --- Live seller count ---
    let sellers_count: string | null = null
    try {
      const countRow = await knex.raw(
        `SELECT COUNT(*) AS cnt FROM seller WHERE store_status = 'ACTIVE'`
      )
      const cnt = parseInt(countRow.rows?.[0]?.cnt || "0", 10)
      if (cnt > 0) sellers_count = cnt.toLocaleString("en-PH")
    } catch {
      // seller table may not exist in all environments
    }

    res.status(200).json({ welcome_promo, featured_campaign, site_settings, sellers_count })
  } catch (error: any) {
    console.error("[Store Hero Content] GET error:", error.message)
    res.status(500).json({ message: "Failed to retrieve hero content", error: error.message })
  }
}
