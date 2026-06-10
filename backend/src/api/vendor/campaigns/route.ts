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
 * GET /seller/campaigns
 * List all campaigns (platform-wide — sellers can see them to link their promotions).
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

    const promotionModule = req.scope.resolve(Modules.PROMOTION)

    const query = req.query as any
    const limit = parseInt(query.limit || "20", 10)
    const offset = parseInt(query.offset || "0", 10)

    const [campaigns, count] = await promotionModule.listAndCountCampaigns(
      {},
      {
        relations: ["promotions", "budget"],
        skip: offset,
        take: limit,
      } as any
    )

    res.status(200).json({ campaigns, count, limit, offset })
  } catch (error: any) {
    console.error("[sellerListCampaigns] Error:", error)
    res.status(500).json({ message: "Failed to list campaigns", error: error.message })
  }
}

/**
 * POST /seller/campaigns
 * Campaign creation is restricted to platform administrators.
 */
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  res.status(403).json({
    message: "Campaign creation is restricted to platform administrators.",
  })
}
