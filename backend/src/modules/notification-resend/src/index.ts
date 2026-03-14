import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import { MaretindaResendProvider } from "./providers"

export default ModuleProvider(Modules.NOTIFICATION, {
  services: [MaretindaResendProvider],
})
