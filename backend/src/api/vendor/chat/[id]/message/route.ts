import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import ChatService from "../../../../../services/chat"

// POST /vendor/chat/:id/message  — send a message
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const chatService: ChatService = req.scope.resolve("chatService")
  const memberId = req.auth_context?.actor_id

  const sellerId = await chatService.getVendorSellerId(memberId)
  if (!sellerId) return res.status(403).json({ message: "Not a vendor" })

  const conv = await chatService.getConversation(req.params.id)
  if (!conv || conv.vendor_id !== sellerId) {
    return res.status(404).json({ message: "Conversation not found" })
  }

  const { body } = req.body as { body: string }
  if (!body?.trim()) return res.status(400).json({ message: "Message body is required" })

  const senderName = await chatService.getVendorName(sellerId)

  const message = await chatService.sendMessage({
    conversation_id: conv.id,
    sender_id: sellerId,
    sender_role: "vendor",
    sender_name: senderName,
    body: body.trim(),
  })

  res.status(201).json({ message })
}
