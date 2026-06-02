import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getChatService } from "../../../services/chat"

// GET /vendor/chat  — list this vendor's conversations
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const chatService = getChatService()
  const memberId = req.auth_context?.actor_id

  const sellerId = await chatService.getVendorSellerId(memberId)
  if (!sellerId) return res.status(403).json({ message: "Not a vendor" })

  const limit = Number(req.query.limit) || 30
  const offset = Number(req.query.offset) || 0

  const { conversations, count } = await chatService.getConversations({
    vendor_id: sellerId,
    limit,
    offset,
  })

  const unread = await chatService.getTotalUnreadVendor(sellerId)

  res.json({ conversations, count, unread })
}
