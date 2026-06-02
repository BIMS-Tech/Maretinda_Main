import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

/**
 * POST /admin/promotions/:id/metadata
 * Body: { metadata: Record<string, any> }
 *
 * Applies metadata directly via the service layer, bypassing Medusa's HTTP
 * validator which does not accept metadata on create/update endpoints.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const { metadata } = req.body as { metadata: Record<string, any> }

  if (!metadata || typeof metadata !== "object") {
    return res.status(400).json({ message: "metadata object is required" })
  }

  try {
    const promotionService = req.scope.resolve(Modules.PROMOTION)
    const [updated] = await (promotionService as any).updatePromotions([
      { id, metadata },
    ])

    res.status(200).json({ promotion: updated })
  } catch (error: any) {
    console.error("[Admin Promotion Metadata] POST error:", error.message)
    res.status(500).json({ message: "Failed to set promotion metadata", error: error.message })
  }
}
