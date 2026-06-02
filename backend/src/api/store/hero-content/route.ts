import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import VoucherService from "../../../services/voucher"

/**
 * GET /store/hero-content
 *
 * Returns two pieces of dynamic content for the storefront hero sidebar:
 *   welcome_promo  — active platform promotion with metadata.hero_slot = "welcome"
 *   featured_campaign — first active public campaign with metadata.is_featured = true,
 *                       falling back to the first active public campaign
 *
 * Both fields are null when nothing is configured, letting the frontend
 * fall back to its hardcoded defaults.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const promotionService = req.scope.resolve(Modules.PROMOTION)
    const voucherService = new VoucherService(req.scope)
    const knex = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const now = new Date()

    // --- Welcome promo ---
    const allActive = await promotionService.listPromotions(
      { status: ["active"] },
      { take: 200, relations: ["application_method", "rules"] }
    )

    const welcomeRaw = (allActive as any[]).find(
      (p) => p.metadata?.hero_slot === "welcome"
    )
    const welcome_promo = welcomeRaw
      ? voucherService.formatPromotion(welcomeRaw)
      : null

    // --- Featured campaign ---
    const allCampaigns = await (promotionService as any).listCampaigns(
      {},
      { take: 50, relations: ["promotions"] }
    )

    const publicCampaigns = (allCampaigns || []).filter((c: any) => {
      if (c.metadata?.is_public !== true) return false
      if (c.ends_at && new Date(c.ends_at) < now) return false
      return true
    })

    const featuredRaw =
      publicCampaigns.find((c: any) => c.metadata?.is_featured === true) ??
      publicCampaigns[0] ??
      null

    let featured_campaign = null
    if (featuredRaw) {
      const endsAt = featuredRaw.ends_at ? new Date(featuredRaw.ends_at) : null
      featured_campaign = {
        id: featuredRaw.id,
        name: featuredRaw.name,
        description: featuredRaw.description || null,
        ends_at: featuredRaw.ends_at || null,
        badge_label: featuredRaw.metadata?.badge_label || null,
        discount_label: featuredRaw.metadata?.discount_label || null,
        shop_link: featuredRaw.metadata?.shop_link || "/categories",
      }
    }

    // --- Site settings hero row ---
    let site_settings: Record<string, any> = {}
    try {
      const row = await knex.raw(
        `SELECT value FROM site_settings WHERE key = 'hero' LIMIT 1`
      )
      if (row.rows.length > 0) {
        site_settings = row.rows[0].value
      }
    } catch {
      // table may not exist yet during first deploy
    }

    res.status(200).json({ welcome_promo, featured_campaign, site_settings })
  } catch (error: any) {
    console.error("[Store Hero Content] GET error:", error.message)
    res.status(500).json({ message: "Failed to retrieve hero content", error: error.message })
  }
}
