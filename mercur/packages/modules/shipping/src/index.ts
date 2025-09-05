import { Module } from "@medusajs/framework/utils"
import ShippingModuleService from "./service"

export const SHIPPING_MODULE = "shipping"

// Export main service
export { ShippingModuleService }

// Export interfaces and types
export * from "./interfaces/shipping-provider.interface"
export * from "./providers/base-provider"

// Export individual services for direct access
export { ShippingService, ShippingDatabaseService } from "./services/shipping"
export { MultiVendorShippingService } from "./services/multi-vendor-shipping.service"
export { TrackingService } from "./services/tracking.service"
export { LalamoveProvider } from "./providers/lalamove-provider"
export { DHLProvider } from "./providers/dhl-provider"
export { ShippingConfigManager } from "./config/shipping-config"

export default Module(SHIPPING_MODULE, {
  service: ShippingModuleService
})
