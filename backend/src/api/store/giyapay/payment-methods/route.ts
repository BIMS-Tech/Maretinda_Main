import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CHECKOUT_METHODS, offeredMethods } from "../../../../lib/giyapay-methods"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const container = req.scope
    
    // Try to get enabled methods from service
    try {
      let giyaPayService
      
      try {
        giyaPayService = container.resolve("giyaPayService") as any
      } catch (serviceError) {
        console.log('[GiyaPay Store Methods] Service not registered, creating on-demand...')
        // Register service on-demand
        const GiyaPayService = require("../../../../services/giyapay").default
        giyaPayService = new GiyaPayService(container)
        container.register({
          giyaPayService: { resolve: () => giyaPayService, lifetime: "SINGLETON" }
        })
        console.log('[GiyaPay Store Methods] Service registered on-demand')
      }

      const config = await giyaPayService.getConfig()
      
      // Check if GiyaPay is enabled
      if (!config || !config.isEnabled) {
        return res.json({
          enabledMethods: [],
          availableMethods: [],
          isEnabled: false
        })
      }
      
      return res.json({
        enabledMethods: offeredMethods(config?.enabledMethods),
        availableMethods: CHECKOUT_METHODS,
        isEnabled: true
      })
    } catch (serviceError) {
      console.log('[GiyaPay Store Methods] Service not available, returning defaults')
      return res.json({
        enabledMethods: CHECKOUT_METHODS,
        availableMethods: CHECKOUT_METHODS,
        isEnabled: true
      })
    }
  } catch (error) {
    console.error('[GiyaPay Store Methods] Error getting methods:', error)
    return res.status(500).json({
      error: "Failed to get payment methods",
      message: (error as Error).message,
    });
  }
}

