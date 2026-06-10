import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  updatePromotionsWorkflow,
  deletePromotionsWorkflow,
} from "@medusajs/core-flows"

async function getSellerIdFromMember(req: any): Promise<string | null> {
  const memberId = req.auth_context?.actor_id
  if (!memberId) return null
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const result = await pg.raw(`SELECT seller_id FROM member WHERE id = ? LIMIT 1`, [memberId])
  return result.rows?.[0]?.seller_id || null
}

async function sellerOwnsPromotion(pg: any, sellerId: string, promotionId: string): Promise<boolean> {
  const result = await pg.raw(
    `SELECT 1 FROM seller_seller_promotion_promotion WHERE deleted_at IS NULL AND seller_id = ? AND promotion_id = ? LIMIT 1`,
    [sellerId, promotionId]
  )
  return result.rows.length > 0
}

/**
 * GET /seller/promotions/:id
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
    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const promotionModule = req.scope.resolve(Modules.PROMOTION)

    if (!await sellerOwnsPromotion(pg, sellerId, id)) {
      res.status(403).json({ message: "Forbidden: promotion does not belong to your store" })
      return
    }

    const promotion = await promotionModule.retrievePromotion(id, {
      relations: ["application_method", "rules", "campaign"],
    } as any)

    if (!promotion) {
      res.status(404).json({ message: "Promotion not found" })
      return
    }

    res.status(200).json({ promotion })
  } catch (error: any) {
    console.error("[sellerGetPromotion] Error:", error)
    res.status(500).json({ message: "Failed to retrieve promotion", error: error.message })
  }
}

/**
 * POST /seller/promotions/:id
 * Update a promotion after verifying ownership.
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

    const { id } = req.params
    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

    if (!await sellerOwnsPromotion(pg, sellerId, id)) {
      res.status(403).json({ message: "Forbidden: promotion does not belong to your store" })
      return
    }

    const body = req.body as any

    const { result } = await updatePromotionsWorkflow(req.scope).run({
      input: {
        promotionsData: [{ id, ...body }],
      },
    })

    const promotion = Array.isArray(result) ? result[0] : result

    res.status(200).json({ promotion })
  } catch (error: any) {
    console.error("[sellerUpdatePromotion] Error:", error)
    res.status(500).json({ message: "Failed to update promotion", error: error.message })
  }
}

/**
 * DELETE /seller/promotions/:id
 */
export async function DELETE(
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
    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

    if (!await sellerOwnsPromotion(pg, sellerId, id)) {
      res.status(403).json({ message: "Forbidden: promotion does not belong to your store" })
      return
    }

    await deletePromotionsWorkflow(req.scope).run({
      input: { ids: [id] },
    })

    // Clean up junction record
    await pg.raw(`UPDATE seller_seller_promotion_promotion SET deleted_at = now() WHERE seller_id = ? AND promotion_id = ? AND deleted_at IS NULL`, [sellerId, id])

    res.status(200).json({ id, deleted: true })
  } catch (error: any) {
    console.error("[sellerDeletePromotion] Error:", error)
    res.status(500).json({ message: "Failed to delete promotion", error: error.message })
  }
}
