import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { getChatService } from "../../../../../services/chat"

// POST /store/chat/:id/message  — customer sends a message
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const chatService = getChatService(req.scope as any)
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Unauthorized" })

  const conv = await chatService.getConversation(req.params.id)
  if (!conv || conv.customer_id !== customerId) {
    return res.status(404).json({ message: "Conversation not found" })
  }

  const { body } = req.body as { body: string }
  if (!body?.trim()) return res.status(400).json({ message: "Message body is required" })

  const senderName = await chatService.getCustomerName(customerId)

  const message = await chatService.sendMessage({
    conversation_id: conv.id,
    sender_id: customerId,
    sender_role: "customer",
    sender_name: senderName,
    body: body.trim(),
  })

  res.status(201).json({ message })
}
