import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import VoucherService from "../../../../services/voucher"

/**
 * GET /store/campaigns/:id
 * Returns a single public campaign with its promotions (as vouchers) and
 * any products targeted by the campaign's promotion rules.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const now = new Date()
    const promotionService = req.scope.resolve(Modules.PROMOTION)

    const campaign = await (promotionService as any).retrieveCampaign(id, {
      relations: ["promotions", "budget"],
    } as any)

    if (!campaign || campaign.metadata?.is_public !== true) {
      return res.status(404).json({ message: "Campaign not found" })
    }

    if (campaign.ends_at && new Date(campaign.ends_at) < now) {
      return res.status(404).json({ message: "Campaign has ended" })
    }

    // Collect product IDs from promotion target rules
    const productIds: string[] = []

    for (const promo of campaign.promotions || []) {
      try {
        const full = await (promotionService as any).retrievePromotion(promo.id, {
          relations: [
            "application_method",
            "application_method.target_rules",
            "application_method.target_rules.values",
          ],
        } as any)

        const rules = full?.application_method?.target_rules || []
        for (const rule of rules) {
          if (rule.attribute === "product_id") {
            for (const val of rule.values || []) {
              if (val.value && !productIds.includes(val.value)) {
                productIds.push(val.value)
              }
            }
          }
        }
      } catch {
        // skip promotions that can't be fetched
      }
    }

    // Fetch product details for targeted products
    let products: any[] = []
    if (productIds.length > 0) {
      try {
        const productService = req.scope.resolve(Modules.PRODUCT)
        const [fetched] = await (productService as any).listProducts(
          { id: productIds },
          { relations: ["images"], take: 50 }
        )
        products = fetched || []
      } catch {
        products = []
      }
    }

    const voucherService = new VoucherService(req.scope)

    res.status(200).json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description || null,
        starts_at: campaign.starts_at || null,
        ends_at: campaign.ends_at || null,
        banner_image: campaign.metadata?.banner_image || null,
        badge_label: campaign.metadata?.badge_label || null,
        budget: campaign.budget
          ? {
              limit: campaign.budget.limit,
              used: campaign.budget.used,
              currency_code: campaign.budget.currency_code,
              type: campaign.budget.type,
            }
          : null,
        promotions: (campaign.promotions || []).map((p: any) =>
          voucherService.formatPromotion(p)
        ),
      },
      products: products.map((p: any) => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
        thumbnail: p.thumbnail || p.images?.[0]?.url || null,
        description: p.description || null,
      })),
    })
  } catch (error: any) {
    console.error("[Store Campaign Detail] Error:", error.message)
    res.status(500).json({ message: "Failed to retrieve campaign", error: error.message })
  }
}
