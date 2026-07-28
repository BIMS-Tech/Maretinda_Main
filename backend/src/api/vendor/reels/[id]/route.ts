import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { getReelsService } from "../../../../services/reels"

async function resolveSeller(req: AuthenticatedMedusaRequest) {
  const reels = getReelsService(req.scope as any)
  const memberId = req.auth_context?.actor_id
  if (!memberId) return { reels, sellerId: null }
  return { reels, sellerId: await reels.getSellerIdFromMember(memberId) }
}

// GET /vendor/reels/:id
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const { reels, sellerId } = await resolveSeller(req)
    if (!sellerId) return res.status(401).json({ message: "Unauthorized" })

    const { id } = req.params
    const reel = await reels.getReel(id)
    if (!reel || reel.seller_id !== sellerId) {
      return res.status(404).json({ message: "Reel not found" })
    }

    res.json({ reel })
  } catch (error: any) {
    console.error("[vendorGetReel]", error)
    res.status(500).json({ message: "Failed to load reel", error: error.message })
  }
}

// POST /vendor/reels/:id — update
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const { reels, sellerId } = await resolveSeller(req)
    if (!sellerId) return res.status(401).json({ message: "Unauthorized" })

    const { id } = req.params
    const body = req.body as any

    const reel = await reels.updateReel(id, sellerId, {
      title: body.title,
      description: body.description,
      video_url: body.video_url,
      thumbnail_url: body.thumbnail_url,
      duration: body.duration,
      product_ids: body.product_ids,
      status: body.status,
    })

    if (!reel) return res.status(404).json({ message: "Reel not found" })

    res.json({ reel })
  } catch (error: any) {
    console.error("[vendorUpdateReel]", error)
    res.status(500).json({ message: "Failed to update reel", error: error.message })
  }
}

// DELETE /vendor/reels/:id
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const { reels, sellerId } = await resolveSeller(req)
    if (!sellerId) return res.status(401).json({ message: "Unauthorized" })

    const deleted = await reels.deleteReel(req.params.id, sellerId)
    if (!deleted) return res.status(404).json({ message: "Reel not found" })

    res.json({ id: req.params.id, object: "reel", deleted: true })
  } catch (error: any) {
    console.error("[vendorDeleteReel]", error)
    res.status(500).json({ message: "Failed to delete reel", error: error.message })
  }
}
