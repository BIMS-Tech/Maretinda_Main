import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { getReelsService, REEL_STATUSES, ReelStatus } from "../../../services/reels"

/**
 * GET /vendor/reels — list the authenticated seller's reels (all statuses).
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const reels = getReelsService(req.scope as any)
    const memberId = req.auth_context?.actor_id
    if (!memberId) return res.status(401).json({ message: "Unauthorized" })

    const sellerId = await reels.getSellerIdFromMember(memberId)
    if (!sellerId) return res.status(401).json({ message: "Unauthorized" })

    const query = req.query as any
    const rawStatus = query.status
    const status = rawStatus
      ? (Array.isArray(rawStatus) ? rawStatus : [rawStatus]).filter((s: string) =>
          REEL_STATUSES.includes(s as ReelStatus)
        )
      : undefined

    const result = await reels.listReels({
      seller_id: sellerId,
      status: status?.length ? (status as ReelStatus[]) : undefined,
      limit: Number(query.limit) || 20,
      offset: Number(query.offset) || 0,
    })

    res.json(result)
  } catch (error: any) {
    console.error("[vendorListReels]", error)
    res.status(500).json({ message: "Failed to list reels", error: error.message })
  }
}

/**
 * POST /vendor/reels — publish a new reel. The video must already be uploaded
 * via /uploads-vendor; this stores the resulting public URL.
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const reels = getReelsService(req.scope as any)
    const memberId = req.auth_context?.actor_id
    if (!memberId) return res.status(401).json({ message: "Unauthorized" })

    const sellerId = await reels.getSellerIdFromMember(memberId)
    if (!sellerId) return res.status(401).json({ message: "Unauthorized" })

    const body = req.body as any
    if (!body?.video_url || typeof body.video_url !== "string") {
      return res.status(400).json({ message: "video_url is required" })
    }

    const reel = await reels.createReel({
      seller_id: sellerId,
      title: body.title,
      description: body.description,
      video_url: body.video_url,
      thumbnail_url: body.thumbnail_url,
      duration: body.duration,
      product_ids: Array.isArray(body.product_ids) ? body.product_ids : [],
      status: body.status,
    })

    res.status(201).json({ reel })
  } catch (error: any) {
    console.error("[vendorCreateReel]", error)
    res.status(500).json({ message: "Failed to create reel", error: error.message })
  }
}
