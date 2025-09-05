import { ModuleProvider, Modules } from '@medusajs/framework/utils'

import GiyaPayProviderService from './services/giyapay-provider'

export default ModuleProvider(Modules.PAYMENT, {
  services: [GiyaPayProviderService]
}) 