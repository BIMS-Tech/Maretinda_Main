import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createPromotionsWorkflow } from "@medusajs/core-flows"

async function getSellerIdFromMember(req: any): Promise<string | null> {
  const memberId = req.auth_context?.actor_id
  if (!memberId) return null
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const result = await pg.raw(`SELECT seller_id FROM member WHERE id = ? LIMIT 1`, [memberId])
  return result.rows?.[0]?.seller_id || null
}

/**
 * GET /vendor/promotions
 * List promotions belonging to the authenticated vendor (filtered by metadata.seller_id).
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

    const [promotions, count] = await promotionModule.listAndCountPromotions(
      { metadata: { seller_id: sellerId } } as any,
      {
        relations: ["application_method", "rules", "campaign"],
        skip: offset,
        take: limit,
      } as any
    )

    res.status(200).json({ promotions, count, limit, offset })
  } catch (error: any) {
    console.error("[VendorListPromotions] Error:", error)
    res.status(500).json({ message: "Failed to list promotions", error: error.message })
  }
}

/**
 * POST /vendor/promotions
 * Create a new promotion for the authenticated vendor.
 * Middleware already injects seller metadata into req.body.metadata.
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

    const body = req.body as any

    const { result } = await createPromotionsWorkflow(req.scope).run({
      input: {
        promotionsData: [body],
      },
    })

    const promotion = Array.isArray(result) ? result[0] : result

    res.status(201).json({ promotion })
  } catch (error: any) {
    console.error("[VendorCreatePromotion] Error:", error)
    res.status(500).json({ message: "Failed to create promotion", error: error.message })
  }
}
