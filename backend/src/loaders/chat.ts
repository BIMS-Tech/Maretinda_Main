import { MedusaContainer } from "@medusajs/framework/types"
import { initChatService } from "../services/chat"

export default async function chatLoader(container: MedusaContainer): Promise<void> {
  console.log("[Chat Loader] ========== INITIALISING CHAT SERVICE ==========")
  try {
    initChatService(container)
    console.log("[Chat Loader] ========== CHAT SERVICE READY ==========")
  } catch (error) {
    console.error("[Chat Loader] ========== FAILED ==========", error)
  }
}
