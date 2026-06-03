import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * GET /vendor/campaign-view/:id
 *
 * Vendor-accessible campaign detail endpoint that bypasses the mercurjs
 * ownership check on /vendor/campaigns/:id. Any authenticated vendor
 * member can view any platform campaign so they can add their own
 * promotions to it.
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    // Verify caller is a valid vendor member with a seller
    const memberId = req.auth_context?.actor_id
    if (!memberId) {
      res.status(401).json({ message: "Unauthorized" })
      return
    }

    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const memberRow = await pg.raw(
      `SELECT seller_id FROM member WHERE id = ? LIMIT 1`,
      [memberId]
    )
    const sellerId = memberRow.rows?.[0]?.seller_id
    if (!sellerId) {
      res.status(401).json({ message: "Unauthorized" })
      return
    }

    const { id } = req.params
    const promotionService = req.scope.resolve(Modules.PROMOTION)

    const campaign = await (promotionService as any).retrieveCampaign(id, {
      relations: ["promotions", "budget"],
    } as any)

    res.status(200).json({ campaign })
  } catch (error: any) {
    if (
      error?.type === "NOT_FOUND" ||
      error?.message?.toLowerCase().includes("not found") ||
      error?.message?.toLowerCase().includes("does not exist")
    ) {
      res.status(404).json({ message: "Campaign not found" })
      return
    }
    console.error("[VendorCampaignView] Error:", error?.message)
    res.status(500).json({ message: "Failed to retrieve campaign" })
  }
}
