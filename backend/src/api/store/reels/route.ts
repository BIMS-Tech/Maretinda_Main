import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getReelsService } from "../../../services/reels"
import { getOptionalCustomerId } from "../../../utils/optional-customer"
import { clampInt } from "../../../lib/pagination"

/**
 * GET /store/reels — public reel feed. Optional `seller_id` narrows it to a
 * single shop; signed-in customers also get a `liked` flag per reel.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const reels = getReelsService(req.scope as any)
    const query = req.query as any

    const { reels: rows, count } = await reels.listReels({
      seller_id: query.seller_id || undefined,
      status: "published",
      visible_only: true,
      limit: clampInt(query.limit, { fallback: 20, min: 1, max: 50 }),
      offset: clampInt(query.offset, { fallback: 0, max: 100000 }),
      viewer_id: getOptionalCustomerId(req) || undefined,
    })

    res.json({ reels: rows, count })
  } catch (error: any) {
    console.error("[storeListReels]", error)
    res.status(500).json({ message: "Failed to load reels" })
  }
}
