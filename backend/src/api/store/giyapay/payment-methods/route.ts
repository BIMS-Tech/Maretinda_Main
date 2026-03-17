import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

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
      
      // Default Gateway Direct payment methods
      const defaultMethods = ['MASTERCARD/VISA', 'GCASH', 'INSTAPAY', 'PAYMAYA', 'QRPH']
      const enabledMethods = config?.enabledMethods || defaultMethods
      
      return res.json({
        enabledMethods,
        availableMethods: ['MASTERCARD/VISA', 'GCASH', 'INSTAPAY', 'PAYMAYA', 'QRPH'],
        isEnabled: true
      })
    } catch (serviceError) {
      console.log('[GiyaPay Store Methods] Service not available, returning defaults')
      return res.json({
        enabledMethods: ['MASTERCARD/VISA', 'GCASH', 'INSTAPAY', 'PAYMAYA', 'QRPH'],
        availableMethods: ['MASTERCARD/VISA', 'GCASH', 'INSTAPAY', 'PAYMAYA', 'QRPH'],
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

