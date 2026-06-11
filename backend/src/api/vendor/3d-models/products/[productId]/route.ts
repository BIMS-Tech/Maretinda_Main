import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /vendor/3d-models/products/:productId
 *
 * Returns all 3D model records for a product owned by the authenticated seller.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
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

    const { productId } = req.params as { productId: string }

    const models = await pg("product_3d_model")
      .where("product_id", productId)
      .where("seller_id", member.seller_id)
      .orderBy("created_at", "desc")

    res.status(200).json({ models })
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to get 3D models" })
  }
}
