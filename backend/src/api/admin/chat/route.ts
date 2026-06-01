import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import ChatService from "../../../services/chat"

// GET /admin/chat  — list all conversations
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const chatService: ChatService = req.scope.resolve("chatService")

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

// POST /admin/chat  — admin starts a conversation with vendor or customer
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const chatService: ChatService = req.scope.resolve("chatService")

  const { vendor_id, customer_id, subject, type } = req.body as {
    vendor_id?: string
    customer_id?: string
    subject?: string
    type?: string
  }

  const convType = type || (vendor_id ? "vendor_admin" : "customer_admin")

  const conversation = await chatService.createAdminConversation({
    vendor_id,
    customer_id,
    subject,
    type: convType,
  })

  res.status(201).json({ conversation })
}
