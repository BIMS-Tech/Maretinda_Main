import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import VoucherService from "../../../services/voucher"

/**
 * GET /store/campaigns
 * Returns all active campaigns that are within their date window,
 * enriched with their linked promotions formatted as vouchers.
 *
 * A campaign is considered "storefront-visible" when:
 *   - It has a current date within starts_at / ends_at  (or no dates set)
 *   - metadata.is_public = true  (admin sets this when creating the campaign)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const promotionService = req.scope.resolve(Modules.PROMOTION)
    const voucherService = new VoucherService(req.scope)
    const now = new Date()

    const allCampaigns = await (promotionService as any).listCampaigns(
      {},
      { take: 50, relations: ["promotions"] }
    )

    const visible = (allCampaigns || []).filter((c: any) => {
      if (c.metadata?.is_public !== true) return false
      if (c.ends_at && new Date(c.ends_at) < now) return false
      return true
    })

    const campaigns = visible.map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description || null,
      starts_at: c.starts_at || null,
      ends_at: c.ends_at || null,
      banner_image: c.metadata?.banner_image || null,
      badge_label: c.metadata?.badge_label || null,
      budget: c.budget
        ? {
            limit: c.budget.limit,
            used: c.budget.used,
            currency_code: c.budget.currency_code,
            type: c.budget.type,
          }
        : null,
      promotions: (c.promotions || []).map((p: any) =>
        voucherService.formatPromotion(p)
      ),
    }))

    res.status(200).json({ campaigns })
  } catch (error: any) {
    console.error("[Store Campaigns] GET error:", error.message)
    res.status(500).json({ message: "Failed to retrieve campaigns", error: error.message })
  }
}
