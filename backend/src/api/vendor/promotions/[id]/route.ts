import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  updatePromotionsWorkflow,
  deletePromotionsWorkflow,
} from "@medusajs/core-flows"

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
 * GET /vendor/promotions/:id
 * Retrieve a single promotion, verifying it belongs to the authenticated vendor.
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

    const promotion = await promotionModule.retrievePromotion(id, {
      relations: ["application_method", "rules", "campaign"],
    } as any)

    if (!promotion) {
      res.status(404).json({ message: "Promotion not found" })
      return
    }

    if ((promotion as any).metadata?.seller_id !== sellerId) {
      res.status(403).json({ message: "Forbidden: promotion does not belong to your store" })
      return
    }

    res.status(200).json({
      promotion: { ...promotion, status: computePromotionStatus(promotion) },
    })
  } catch (error: any) {
    console.error("[VendorGetPromotion] Error:", error)
    res.status(500).json({ message: "Failed to retrieve promotion", error: error.message })
  }
}

/**
 * PUT /vendor/promotions/:id
 * Update a promotion after verifying ownership.
 * Middleware already injects seller metadata into req.body.metadata.
 */
export async function PUT(
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

    const existing = await promotionModule.retrievePromotion(id, {} as any)
    if (!existing) {
      res.status(404).json({ message: "Promotion not found" })
      return
    }

    if ((existing as any).metadata?.seller_id !== sellerId) {
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
 * Delete a promotion after verifying ownership.
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
    const promotionModule = req.scope.resolve(Modules.PROMOTION)

    const existing = await promotionModule.retrievePromotion(id, {} as any)
    if (!existing) {
      res.status(404).json({ message: "Promotion not found" })
      return
    }

    if ((existing as any).metadata?.seller_id !== sellerId) {
      res.status(403).json({ message: "Forbidden: promotion does not belong to your store" })
      return
    }

    await deletePromotionsWorkflow(req.scope).run({
      input: { ids: [id] },
    })

    res.status(200).json({ id, deleted: true })
  } catch (error: any) {
    console.error("[VendorDeletePromotion] Error:", error)
    res.status(500).json({ message: "Failed to delete promotion", error: error.message })
  }
}
