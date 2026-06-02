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
 * List promotions belonging to the authenticated vendor via seller_promotion junction table.
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

    const countResult = await pg.raw(
      `SELECT COUNT(*) AS total FROM seller_seller_promotion_promotion WHERE deleted_at IS NULL AND seller_id = ?`,
      [sellerId]
    )
    const count = parseInt(countResult.rows[0]?.total || "0", 10)

    const idsResult = await pg.raw(
      `SELECT promotion_id FROM seller_seller_promotion_promotion WHERE deleted_at IS NULL AND seller_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [sellerId, limit, offset]
    )
    const ids: string[] = idsResult.rows.map((r: any) => r.promotion_id)

    if (!ids.length) {
      res.status(200).json({ promotions: [], count: 0, limit, offset })
      return
    }

    const promotions = await promotionModule.listPromotions(
      { id: ids } as any,
      { relations: ["application_method", "rules", "campaign"] } as any
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

    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const body = req.body as any

    const { result } = await createPromotionsWorkflow(req.scope).run({
      input: {
        promotionsData: [body],
      },
    })

    const promotion = Array.isArray(result) ? result[0] : result

    // Record seller ownership in the seller module's junction table
    await pg.raw(
      `INSERT INTO seller_seller_promotion_promotion (id, seller_id, promotion_id)
       VALUES (gen_random_uuid(), ?, ?)
       ON CONFLICT (seller_id, promotion_id) DO NOTHING`,
      [sellerId, promotion.id]
    )

    res.status(201).json({ promotion })
  } catch (error: any) {
    console.error("[VendorCreatePromotion] Error:", error)
    res.status(500).json({ message: "Failed to create promotion", error: error.message })
  }
}
