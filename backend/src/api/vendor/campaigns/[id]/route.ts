import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

async function getSellerIdFromMember(req: any): Promise<string | null> {
  const memberId = req.auth_context?.actor_id
  if (!memberId) return null
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const result = await pg.raw(`SELECT seller_id FROM member WHERE id = ? LIMIT 1`, [memberId])
  return result.rows?.[0]?.seller_id || null
}

/**
 * GET /vendor/campaigns/:id
 * Retrieve a single campaign by ID.
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const sellerId = await getSellerIdFromMember(req)
    if (!sellerId) {
      res.status(401).json({ message: "Unauthorized" })
      return
    }

    const { id } = req.params
    const promotionModule = req.scope.resolve(Modules.PROMOTION)

    const campaign = await promotionModule.retrieveCampaign(id, {
      relations: ["promotions", "budget"],
    } as any)

    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" })
      return
    }

    res.status(200).json({ campaign })
  } catch (error: any) {
    console.error("[VendorGetCampaign] Error:", error)
    res.status(500).json({ message: "Failed to retrieve campaign", error: error.message })
  }
}

/**
 * PUT /vendor/campaigns/:id
 * Campaign updates are restricted to platform administrators.
 */
export async function PUT(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  res.status(403).json({
    message: "Campaign creation is restricted to platform administrators.",
  })
}

/**
 * DELETE /vendor/campaigns/:id
 * Campaign deletion is restricted to platform administrators.
 */
export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  res.status(403).json({
    message: "Campaign creation is restricted to platform administrators.",
  })
}
