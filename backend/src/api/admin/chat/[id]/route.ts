import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { getChatService } from "../../../../services/chat"

// GET /admin/chat/:id  — get conversation + messages
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const chatService = getChatService()

  const conv = await chatService.getConversation(req.params.id)
  if (!conv) return res.status(404).json({ message: "Conversation not found" })

  const limit = Number(req.query.limit) || 50
  const offset = Number(req.query.offset) || 0

  const { messages, count } = await chatService.getMessages(conv.id, limit, offset)

  res.json({ conversation: conv, messages, count })
}

// PATCH /admin/chat/:id  — close conversation
export async function PATCH(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const chatService = getChatService()

  const { status } = req.body as { status: string }
  if (status === "closed") {
    await chatService.closeConversation(req.params.id)
  }

  const conv = await chatService.getConversation(req.params.id)
  res.json({ conversation: conv })
}
