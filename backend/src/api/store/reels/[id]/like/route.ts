import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { getReelsService } from "../../../../../services/reels"

/**
 * POST /store/reels/:id/like — toggles the signed-in customer's like.
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const reels = getReelsService(req.scope as any)
    const customerId = req.auth_context?.actor_id
    if (!customerId) return res.status(401).json({ message: "Unauthorized" })

    const reel = await reels.getReel(req.params.id)
    if (!reel || reel.status !== "published") {
      return res.status(404).json({ message: "Reel not found" })
    }

    const result = await reels.toggleLike(req.params.id, customerId)
    res.json(result)
  } catch (error: any) {
    console.error("[storeToggleReelLike]", error)
    res.status(500).json({ message: "Failed to update like", error: error.message })
  }
}
