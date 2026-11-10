import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getReelsService } from "../../../../../services/reels"

/**
 * POST /admin/reels/:id/hide — takes a reel off the storefront. The reason
 * is shown to the seller, so it's required.
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const reason = String((req.body as any)?.reason ?? "").trim().slice(0, 500)
  if (!reason) return res.status(400).json({ message: "Say why the reel is hidden; the seller sees it" })

  const reel = await getReelsService(req.scope as any).moderateReel(req.params.id, {
    moderation_status: "hidden",
    reason,
    by: req.auth_context.actor_id,
  })
  if (!reel) return res.status(404).json({ message: "Reel not found" })
  res.json({ reel })
}
