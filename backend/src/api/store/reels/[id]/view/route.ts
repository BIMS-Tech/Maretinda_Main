import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getReelsService } from "../../../../../services/reels"

/**
 * POST /store/reels/:id/view — fire-and-forget view counter. Public: view
 * counts shouldn't require a customer account.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const reels = getReelsService(req.scope as any)
    await reels.incrementView(req.params.id)
    res.status(200).json({ ok: true })
  } catch (error: any) {
    console.error("[storeReelView]", error)
    // Never fail the player over analytics.
    res.status(200).json({ ok: false })
  }
}
