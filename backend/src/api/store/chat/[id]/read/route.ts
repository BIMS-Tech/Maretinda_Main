import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { getChatService } from "../../../../../services/chat"

// POST /store/chat/:id/read  — mark conversation read for customer
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const chatService = getChatService(req.scope as any)
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Unauthorized" })

  const conv = await chatService.getConversation(req.params.id)
  if (!conv || conv.customer_id !== customerId) {
    return res.status(404).json({ message: "Conversation not found" })
  }

  await chatService.markRead(conv.id, "customer")
  res.json({ success: true })
}
