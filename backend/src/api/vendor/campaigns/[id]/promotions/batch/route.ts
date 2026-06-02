import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

async function getSellerIdFromMember(req: any): Promise<string | null> {
  const memberId = req.auth_context?.actor_id
  if (!memberId) return null
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const result = await pg.raw(
    `SELECT seller_id FROM member WHERE id = ? LIMIT 1`,
    [memberId]
  )
  return result.rows?.[0]?.seller_id || null
}

/**
 * POST /vendor/campaigns/:id/promotions/batch
 * Body: { add?: string[], remove?: string[] }
 *
 * Allows a vendor to link or unlink their own promotions to a campaign.
 * Only allows adding promotions that belong to the authenticated vendor.
 */
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const sellerId = await getSellerIdFromMember(req)
    if (!sellerId) {
      res.status(401).json({ message: "Unauthorized" })
      return
    }

    const { id: campaignId } = req.params
    const { add = [], remove = [] } = req.body as {
      add?: string[]
      remove?: string[]
    }

    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const promotionModule = req.scope.resolve(Modules.PROMOTION)

    // Verify all promotions being added belong to this vendor
    if (add.length > 0) {
      const owned = await pg.raw(
        `SELECT promotion_id FROM seller_seller_promotion_promotion WHERE deleted_at IS NULL AND seller_id = ? AND promotion_id = ANY(?)`,
        [sellerId, add]
      )
      const ownedIds = owned.rows.map((r: any) => r.promotion_id)
      const unauthorized = add.filter((id) => !ownedIds.includes(id))
      if (unauthorized.length > 0) {
        res.status(403).json({
          message: "You can only add your own promotions to a campaign.",
        })
        return
      }
    }

    // Apply changes via Medusa promotion service
    if (add.length > 0) {
      await (promotionModule as any).addPromotionsToCampaign({
        id: campaignId,
        promotion_ids: add,
      })
    }

    if (remove.length > 0) {
      await (promotionModule as any).removePromotionsFromCampaign({
        id: campaignId,
        promotion_ids: remove,
      })
    }

    const campaign = await promotionModule.retrieveCampaign(campaignId, {
      relations: ["promotions", "budget"],
    } as any)

    res.status(200).json({ campaign })
  } catch (error: any) {
    console.error("[VendorCampaignPromotionsBatch] POST error:", error.message)
    res.status(500).json({
      message: "Failed to update campaign promotions",
      error: error.message,
    })
  }
}
