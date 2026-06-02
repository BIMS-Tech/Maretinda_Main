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
    `SELECT 1 FROM seller_promotion WHERE seller_id = ? AND promotion_id = ? LIMIT 1`,
    [sellerId, promotionId]
  )
  return result.rows.length > 0
}

/**
 * GET /vendor/promotions/:id
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
    console.error("[VendorGetPromotion] Error:", error)
    res.status(500).json({ message: "Failed to retrieve promotion", error: error.message })
  }
}

/**
 * POST /vendor/promotions/:id
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
    console.error("[VendorUpdatePromotion] Error:", error)
    res.status(500).json({ message: "Failed to update promotion", error: error.message })
  }
}

/**
 * DELETE /vendor/promotions/:id
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
    await pg.raw(`DELETE FROM seller_promotion WHERE seller_id = ? AND promotion_id = ?`, [sellerId, id])

    res.status(200).json({ id, deleted: true })
  } catch (error: any) {
    console.error("[VendorDeletePromotion] Error:", error)
    res.status(500).json({ message: "Failed to delete promotion", error: error.message })
  }
}
