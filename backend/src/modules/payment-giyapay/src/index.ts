import { ModuleProvider, Modules } from '@medusajs/framework/utils'

import GiyaPayProviderService from './services/giyapay-provider'

// Only register one provider service that handles all GiyaPay payment methods
export default ModuleProvider(Modules.PAYMENT, {
  services: [
    GiyaPayProviderService
  ]
})
