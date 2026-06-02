import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { getChatService } from "../../../../../services/chat"

// POST /admin/chat/:id/message  — admin sends a message
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const chatService = getChatService()

  const conv = await chatService.getConversation(req.params.id)
  if (!conv) return res.status(404).json({ message: "Conversation not found" })

  const { body } = req.body as { body: string }
  if (!body?.trim()) return res.status(400).json({ message: "Message body is required" })

  const message = await chatService.sendMessage({
    conversation_id: conv.id,
    sender_id: req.auth_context?.actor_id || "admin",
    sender_role: "admin",
    sender_name: "Support Team",
    body: body.trim(),
  })

  res.status(201).json({ message })
}
