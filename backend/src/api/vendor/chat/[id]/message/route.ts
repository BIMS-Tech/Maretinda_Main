import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { getChatService } from "../../../../../services/chat"

// POST /seller/chat/:id/message  — send a message
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const chatService = getChatService(req.scope as any)
  const memberId = req.auth_context?.actor_id

  const sellerId = await chatService.getsellersellerId(memberId)
  if (!sellerId) return res.status(403).json({ message: "Not a seller" })

  const conv = await chatService.getConversation(req.params.id)
  if (!conv || conv.seller_id !== sellerId) {
    return res.status(404).json({ message: "Conversation not found" })
  }

  const { body } = req.body as { body: string }
  if (!body?.trim()) return res.status(400).json({ message: "Message body is required" })

  const senderName = await chatService.getsellerName(sellerId)

  const message = await chatService.sendMessage({
    conversation_id: conv.id,
    sender_id: sellerId,
    sender_role: "seller",
    sender_name: senderName,
    body: body.trim(),
  })

  res.status(201).json({ message })
}
