import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { getChatService } from "../../../services/chat"

// GET /admin/chat  — list all conversations
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const chatService = getChatService(req.scope as any)

  const limit = Number(req.query.limit) || 30
  const offset = Number(req.query.offset) || 0

  const { conversations, count } = await chatService.getConversations({
    is_admin: true,
    limit,
    offset,
  })

  const unread = await chatService.getTotalUnreadAdmin()

  res.json({ conversations, count, unread })
}

// POST /admin/chat  — admin starts a conversation with seller or customer
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const chatService = getChatService(req.scope as any)

  const { seller_id, customer_id, subject, type } = req.body as {
    seller_id?: string
    customer_id?: string
    subject?: string
    type?: string
  }

  const convType = type || (seller_id ? "seller_admin" : "customer_admin")

  const conversation = await chatService.createAdminConversation({
    seller_id,
    customer_id,
    subject,
    type: convType,
  })

  res.status(201).json({ conversation })
}
