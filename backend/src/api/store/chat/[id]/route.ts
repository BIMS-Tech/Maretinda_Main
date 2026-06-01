import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import ChatService from "../../../../services/chat"

// GET /store/chat/:id  — get conversation + messages
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const chatService: ChatService = req.scope.resolve("chatService")
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Unauthorized" })

  const conv = await chatService.getConversation(req.params.id)
  if (!conv || conv.customer_id !== customerId) {
    return res.status(404).json({ message: "Conversation not found" })
  }

  const limit = Number(req.query.limit) || 50
  const offset = Number(req.query.offset) || 0

  const { messages, count } = await chatService.getMessages(conv.id, limit, offset)

  res.json({ conversation: conv, messages, count })
}
