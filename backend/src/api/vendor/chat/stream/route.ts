import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { getChatService } from "../../../../services/chat"

// GET /vendor/chat/stream  — SSE real-time stream for vendor
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const chatService = getChatService(req.scope as any)
  const memberId = req.auth_context?.actor_id

  const sellerId = await chatService.getVendorSellerId(memberId)
  if (!sellerId) return res.status(403).json({ message: "Not a vendor" })

  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache, no-transform")
  res.setHeader("Connection", "keep-alive")
  res.setHeader("X-Accel-Buffering", "no")
  res.flushHeaders()

  // Send initial ping so client knows the connection is alive
  res.write(`:connected\n\n`)

  chatService.addConnection(sellerId, res as any)

  const heartbeat = setInterval(() => {
    try { res.write(`:heartbeat\n\n`) } catch { clearInterval(heartbeat) }
  }, 25000)

  req.on("close", () => {
    clearInterval(heartbeat)
    chatService.removeConnection(sellerId, res as any)
  })
}
