import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { metadataForPromotions, savePromotionMetadata } from "../../../../../lib/promotion-metadata"

/** GET /admin/promotions/:id/metadata */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const metadata = (await metadataForPromotions(pg, [req.params.id])).get(req.params.id) ?? {}
  res.status(200).json({ metadata })
}

/**
 * POST /admin/promotions/:id/metadata
 * Body: { metadata: Record<string, any> }
 *
 * Stored in promotion_metadata: Medusa's promotion table has no metadata column
 * and its update silently ignores the field.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const { metadata } = req.body as { metadata: Record<string, any> }

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return res.status(400).json({ message: "metadata object is required" })
  }

  try {
    const [promotion] = await req.scope.resolve(Modules.PROMOTION).listPromotions({ id: [id] })
    if (!promotion) return res.status(404).json({ message: "Promotion not found" })

    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const merged = await savePromotionMetadata(pg, id, metadata)

    res.status(200).json({ promotion: { ...promotion, metadata: merged } })
  } catch (error: any) {
    console.error("[Admin Promotion Metadata] POST error:", error.message)
    res.status(500).json({ message: "Failed to set promotion metadata" })
  }
}
