import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { getChatService } from "../../../../../services/chat"

// POST /seller/chat/:id/read  — mark conversation as read for seller
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const chatService = getChatService(req.scope as any)
  const memberId = req.auth_context?.actor_id

  const sellerId = await chatService.getsellersellerId(memberId)
  if (!sellerId) return res.status(403).json({ message: "Not a seller" })

  const conv = await chatService.getConversation(req.params.id)
  if (!conv || conv.seller_id !== sellerId) {
    return res.status(404).json({ message: "Conversation not found" })
  }

  await chatService.markRead(conv.id, "seller")
  res.json({ success: true })
}
