import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import { GCSFileProvider } from "./providers"

export default ModuleProvider(Modules.FILE, {
  services: [GCSFileProvider],
})
