import { MedusaContainer } from "@medusajs/framework/types"
import ChatService from "../services/chat"

export default async function chatLoader(container: MedusaContainer): Promise<void> {
  console.log("[Chat Loader] ========== LOADING CHAT SERVICE ==========")
  try {
    container.register({
      chatService: {
        resolve: () => new ChatService(container),
        lifetime: "SINGLETON",
      },
    })
    console.log("[Chat Loader] ========== CHAT SERVICE REGISTERED ==========")
  } catch (error) {
    console.error("[Chat Loader] ========== FAILED ==========", error)
  }
}
