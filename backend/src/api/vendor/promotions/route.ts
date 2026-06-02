import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createPromotionsWorkflow } from "@medusajs/core-flows"

function computePromotionStatus(promotion: any): string {
  if (promotion.is_disabled) return "draft"
  const now = new Date()
  if (promotion.starts_at && new Date(promotion.starts_at) > now) return "scheduled"
  if (promotion.ends_at && new Date(promotion.ends_at) < now) return "expired"
  return "active"
}

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

    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const promotionModule = req.scope.resolve(Modules.PROMOTION)

    const rawQuery = req.query as any
    const limit = parseInt(rawQuery.limit || "20", 10)
    const offset = parseInt(rawQuery.offset || "0", 10)

    // Use raw SQL to filter by JSONB metadata field
    const countResult = await pg.raw(
      `SELECT COUNT(*) AS total FROM promotion WHERE metadata->>'seller_id' = ? AND deleted_at IS NULL`,
      [sellerId]
    )
    const count = parseInt(countResult.rows[0]?.total || "0", 10)

    const idsResult = await pg.raw(
      `SELECT id FROM promotion WHERE metadata->>'seller_id' = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [sellerId, limit, offset]
    )
    const ids: string[] = idsResult.rows.map((r: any) => r.id)

    if (!ids.length) {
      res.status(200).json({ promotions: [], count: 0, limit, offset })
      return
    }

    const promotions = await promotionModule.listPromotions(
      { id: ids } as any,
      { relations: ["application_method", "rules", "campaign"] } as any
    )

    const promotionsWithStatus = promotions.map((p: any) => ({
      ...p,
      status: computePromotionStatus(p),
    }))

    res.status(200).json({ promotions: promotionsWithStatus, count, limit, offset })
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
