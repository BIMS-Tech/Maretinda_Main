import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * DELETE /vendor/3d-models/:modelId
 *
 * Deletes a 3D model record owned by the authenticated seller.
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse): Promise<void> {
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

    const deleted = await pg("product_3d_model")
      .where("id", modelId)
      .where("seller_id", member.seller_id)
      .delete()

    if (!deleted) {
      res.status(404).json({ message: "Model not found" })
      return
    }

    res.status(200).json({ success: true })
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to delete 3D model" })
  }
}

/**
 * PATCH /vendor/3d-models/:modelId
 *
 * Updates a 3D model record (e.g. set is_primary).
 */
export async function PATCH(req: MedusaRequest, res: MedusaResponse): Promise<void> {
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
    const { is_primary } = req.body as { is_primary?: boolean }

    const model = await pg("product_3d_model")
      .where("id", modelId)
      .where("seller_id", member.seller_id)
      .first()

    if (!model) {
      res.status(404).json({ message: "Model not found" })
      return
    }

    if (is_primary === true) {
      // Clear other primary flags for this product
      await pg("product_3d_model")
        .where("product_id", model.product_id)
        .where("seller_id", member.seller_id)
        .update({ is_primary: false, updated_at: new Date() })
    }

    await pg("product_3d_model")
      .where("id", modelId)
      .update({ is_primary: is_primary ?? model.is_primary, updated_at: new Date() })

    const updated = await pg("product_3d_model").where("id", modelId).first()
    res.status(200).json({ model: updated })
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update 3D model" })
  }
}
