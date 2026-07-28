import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getReelsService } from "../../../services/reels"
import { getOptionalCustomerId } from "../../../utils/optional-customer"

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
      limit: Math.min(Number(query.limit) || 20, 50),
      offset: Number(query.offset) || 0,
      viewer_id: getOptionalCustomerId(req) || undefined,
    })

    res.json({ reels: rows, count })
  } catch (error: any) {
    console.error("[storeListReels]", error)
    res.status(500).json({ message: "Failed to load reels", error: error.message })
  }
}
