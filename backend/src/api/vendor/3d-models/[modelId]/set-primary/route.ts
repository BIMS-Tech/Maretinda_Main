import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * POST /vendor/3d-models/:modelId/set-primary
 *
 * Marks a completed 3D model as the primary/showcase model for its product.
 * Clears the primary flag on any previously set model.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const memberId = (req as any).auth_context?.actor_id || (req as any).user?.id
    if (!memberId) {
      res.status(401).json({ message: "Unauthorized" })
      return
    }

    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const member = await pg("member").where("id", memberId).first()
    if (!member?.seller_id) {
      res.status(403).json({ message: "Not a seller" })
      return
    }

    const { modelId } = req.params as { modelId: string }

    const model = await pg("product_3d_model")
      .where("id", modelId)
      .where("seller_id", member.seller_id)
      .first()

    if (!model) {
      res.status(404).json({ message: "Model not found" })
      return
    }

    if (model.status !== "completed") {
      res.status(400).json({ message: "Only completed models can be set as primary" })
      return
    }

    // Clear primary on all other models for this product
    await pg("product_3d_model")
      .where("product_id", model.product_id)
      .where("seller_id", member.seller_id)
      .update({ is_primary: false, updated_at: new Date() })

    await pg("product_3d_model")
      .where("id", modelId)
      .update({ is_primary: true, updated_at: new Date() })

    const updated = await pg("product_3d_model").where("id", modelId).first()
    res.status(200).json({ model: updated })
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to set primary model" })
  }
}
