import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import ChatService from "../../../../../services/chat"

// POST /admin/chat/:id/read  — mark conversation read for admin
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const chatService: ChatService = req.scope.resolve("chatService")

  const conv = await chatService.getConversation(req.params.id)
  if (!conv) return res.status(404).json({ message: "Conversation not found" })

  await chatService.markRead(conv.id, "admin")
  res.json({ success: true })
}
