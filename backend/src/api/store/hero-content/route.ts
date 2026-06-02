import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import VoucherService from "../../../services/voucher"

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

    // --- Welcome promo ---
    let welcome_promo = null
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
        badge_label: null,
        discount_label: null,
        shop_link: "/categories",
      }
    }

    res.status(200).json({ welcome_promo, featured_campaign, site_settings })
  } catch (error: any) {
    console.error("[Store Hero Content] GET error:", error.message)
    res.status(500).json({ message: "Failed to retrieve hero content", error: error.message })
  }
}
