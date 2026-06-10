import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getChatService } from "../../../services/chat"

// GET /seller/chat  — list this seller's conversations
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const chatService = getChatService(req.scope as any)
  const memberId = req.auth_context?.actor_id

  const sellerId = await chatService.getsellersellerId(memberId)
  if (!sellerId) return res.status(403).json({ message: "Not a seller" })

  const limit = Number(req.query.limit) || 30
  const offset = Number(req.query.offset) || 0

  const { conversations, count } = await chatService.getConversations({
    seller_id: sellerId,
    limit,
    offset,
  })

  const unread = await chatService.getTotalUnreadseller(sellerId)

  res.json({ conversations, count, unread })
}
