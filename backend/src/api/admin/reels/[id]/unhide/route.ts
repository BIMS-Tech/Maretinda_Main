import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getReelsService } from "../../../../../services/reels"

/** POST /admin/reels/:id/unhide — puts a hidden reel back on the storefront. */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const reel = await getReelsService(req.scope as any).moderateReel(req.params.id, {
    moderation_status: "visible",
    reason: null,
    by: req.auth_context.actor_id,
  })
  if (!reel) return res.status(404).json({ message: "Reel not found" })
  res.json({ reel })
}
