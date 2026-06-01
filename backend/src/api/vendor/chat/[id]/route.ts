import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import ChatService from "../../../../services/chat"

// GET /vendor/chat/:id  — get conversation + messages
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const chatService: ChatService = req.scope.resolve("chatService")
  const memberId = req.auth_context?.actor_id

  const sellerId = await chatService.getVendorSellerId(memberId)
  if (!sellerId) return res.status(403).json({ message: "Not a vendor" })

  const conv = await chatService.getConversation(req.params.id)
  if (!conv || conv.vendor_id !== sellerId) {
    return res.status(404).json({ message: "Conversation not found" })
  }

  const limit = Number(req.query.limit) || 50
  const offset = Number(req.query.offset) || 0

  const { messages, count } = await chatService.getMessages(conv.id, limit, offset)

  res.json({ conversation: conv, messages, count })
}
