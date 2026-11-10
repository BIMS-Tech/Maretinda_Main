import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getReelsService } from "../../../../services/reels"

/** DELETE /admin/reels/:id — removes a reel for good. */
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const removed = await getReelsService(req.scope as any).removeReel(req.params.id)
  if (!removed) return res.status(404).json({ message: "Reel not found" })
  res.json({ id: req.params.id, deleted: true })
}
