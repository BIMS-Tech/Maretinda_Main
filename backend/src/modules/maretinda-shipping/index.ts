import { ModuleProvider, Modules } from '@medusajs/framework/utils'
import MaretindaShippingProviderService from './service'

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [MaretindaShippingProviderService],
})
