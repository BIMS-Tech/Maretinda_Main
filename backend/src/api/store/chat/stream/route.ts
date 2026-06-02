import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { getChatService } from "../../../../services/chat"

// GET /store/chat/stream  — SSE real-time stream for customer
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const chatService = getChatService(req.scope as any)
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Unauthorized" })

  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache, no-transform")
  res.setHeader("Connection", "keep-alive")
  res.setHeader("X-Accel-Buffering", "no")
  res.flushHeaders()

  res.write(`:connected\n\n`)

  chatService.addConnection(customerId, res as any)

  const heartbeat = setInterval(() => {
    try { res.write(`:heartbeat\n\n`) } catch { clearInterval(heartbeat) }
  }, 25000)

  req.on("close", () => {
    clearInterval(heartbeat)
    chatService.removeConnection(customerId, res as any)
  })
}
