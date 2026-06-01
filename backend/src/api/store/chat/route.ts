import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import ChatService from "../../../services/chat"

// GET /store/chat  — list customer's conversations
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const chatService: ChatService = req.scope.resolve("chatService")
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Unauthorized" })

  const limit = Number(req.query.limit) || 30
  const offset = Number(req.query.offset) || 0

  const { conversations, count } = await chatService.getConversations({
    customer_id: customerId,
    limit,
    offset,
  })

  const unread = await chatService.getTotalUnreadCustomer(customerId)

  res.json({ conversations, count, unread })
}

// POST /store/chat  — start conversation with a vendor
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const chatService: ChatService = req.scope.resolve("chatService")
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Unauthorized" })

  const { vendor_id, subject } = req.body as { vendor_id: string; subject?: string }
  if (!vendor_id) return res.status(400).json({ message: "vendor_id is required" })

  const conversation = await chatService.getOrCreateConversation(vendor_id, customerId, subject)

  res.status(201).json({ conversation })
}
