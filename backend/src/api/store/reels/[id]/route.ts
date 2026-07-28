import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getReelsService } from "../../../../services/reels"
import { getOptionalCustomerId } from "../../../../utils/optional-customer"

// GET /store/reels/:id — public, published reels only.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const reels = getReelsService(req.scope as any)
    const reel = await reels.getReel(req.params.id, getOptionalCustomerId(req) || undefined)

    if (!reel || reel.status !== "published") {
      return res.status(404).json({ message: "Reel not found" })
    }

    res.json({ reel })
  } catch (error: any) {
    console.error("[storeGetReel]", error)
    res.status(500).json({ message: "Failed to load reel", error: error.message })
  }
}
