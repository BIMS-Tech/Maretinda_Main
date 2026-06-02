import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { getChatService } from "../../../../../services/chat"

// POST /vendor/chat/:id/read  — mark conversation as read for vendor
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const chatService = getChatService()
  const memberId = req.auth_context?.actor_id

  const sellerId = await chatService.getVendorSellerId(memberId)
  if (!sellerId) return res.status(403).json({ message: "Not a vendor" })

  const conv = await chatService.getConversation(req.params.id)
  if (!conv || conv.vendor_id !== sellerId) {
    return res.status(404).json({ message: "Conversation not found" })
  }

  await chatService.markRead(conv.id, "vendor")
  res.json({ success: true })
}
