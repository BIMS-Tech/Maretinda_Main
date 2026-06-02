import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { getChatService } from "../../../../services/chat"

// GET /admin/chat/stream  — SSE real-time stream for admin
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const chatService = getChatService(req.scope as any)

  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache, no-transform")
  res.setHeader("Connection", "keep-alive")
  res.setHeader("X-Accel-Buffering", "no")
  res.flushHeaders()

  res.write(`:connected\n\n`)

  // All admins share the same event channel — any admin gets all events
  chatService.addConnection("__admin__", res as any)

  const heartbeat = setInterval(() => {
    try { res.write(`:heartbeat\n\n`) } catch { clearInterval(heartbeat) }
  }, 25000)

  req.on("close", () => {
    clearInterval(heartbeat)
    chatService.removeConnection("__admin__", res as any)
  })
}
