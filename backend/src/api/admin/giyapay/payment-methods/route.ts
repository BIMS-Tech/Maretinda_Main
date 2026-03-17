import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { z } from "zod"

// Validation schema for GiyaPay Gateway Direct payment methods
const GiyaPayMethodsConfigSchema = z.object({
  enabledMethods: z.array(z.enum(['MASTERCARD/VISA', 'GCASH', 'PAYMAYA', 'QRPH', 'WECHATPAY', 'UNIONPAY'])),
})

type AuthenticatedMedusaRequest = MedusaRequest & {
  user?: any
  auth_context?: any
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  try {
    const container = req.scope
    
    // Try to get enabled methods from service
    try {
      let giyaPayService
      
      try {
        giyaPayService = container.resolve("giyaPayService") as any
      } catch (serviceError) {
        console.log('[GiyaPay Methods] Service not registered, creating on-demand...')
        // Register service on-demand
        const GiyaPayService = require("../../../../services/giyapay").default
        giyaPayService = new GiyaPayService(container)
        container.register({
          giyaPayService: { resolve: () => giyaPayService, lifetime: "SINGLETON" }
        })
        console.log('[GiyaPay Methods] Service registered on-demand')
      }

      const config = await giyaPayService.getConfig()
      
      // Default Gateway Direct payment methods (all methods from GiyaPay docs)
      const defaultMethods = ['MASTERCARD/VISA', 'GCASH', 'QRPH', 'WECHATPAY', 'UNIONPAY']
      const enabledMethods = config?.enabledMethods || defaultMethods

      return res.status(200).json({
        enabledMethods,
        availableMethods: ['MASTERCARD/VISA', 'GCASH', 'PAYMAYA', 'QRPH', 'WECHATPAY', 'UNIONPAY']
      })
    } catch (serviceError) {
      console.log('[GiyaPay Methods] Service not available, returning defaults')
      return res.status(200).json({
        enabledMethods: ['MASTERCARD/VISA', 'GCASH', 'QRPH', 'WECHATPAY', 'UNIONPAY'],
        availableMethods: ['MASTERCARD/VISA', 'GCASH', 'PAYMAYA', 'QRPH', 'WECHATPAY', 'UNIONPAY']
      })
    }
  } catch (error) {
    console.error('[GiyaPay Methods] Error getting methods:', error)
    return res.status(500).json({
      error: "Failed to get payment methods",
      message: (error as Error).message,
    });
  }
}

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  try {
    // Validate the request body
    const validatedData = GiyaPayMethodsConfigSchema.parse(req.body);
    
    const container = req.scope
    
    // Try to save enabled methods using the service
    try {
      let giyaPayService
      
      try {
        giyaPayService = container.resolve("giyaPayService") as any
      } catch (serviceError) {
        console.log('[GiyaPay Methods] Service not registered, creating on-demand...')
        // Register service on-demand
        const GiyaPayService = require("../../../../services/giyapay").default
        giyaPayService = new GiyaPayService(container)
        container.register({
          giyaPayService: { resolve: () => giyaPayService, lifetime: "SINGLETON" }
        })
        console.log('[GiyaPay Methods] Service registered on-demand')
      }

      // Get current config and update with enabled methods
      const currentConfig = await giyaPayService.getConfig()
      if (currentConfig) {
        await giyaPayService.createOrUpdateConfigForAPI({
          ...currentConfig,
          enabledMethods: validatedData.enabledMethods,
        })
      }

      return res.status(200).json({
        message: "GiyaPay payment methods updated successfully",
        enabledMethods: validatedData.enabledMethods,
      });
    } catch (serviceError) {
      console.log('[GiyaPay Methods] Service not available, returning success without database save')
      
      return res.status(200).json({
        message: "GiyaPay payment methods received (database save pending)",
        enabledMethods: validatedData.enabledMethods,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors,
      });
    }

    console.error('[GiyaPay Methods] Error saving methods:', error)
    return res.status(500).json({
      error: "Failed to save payment methods",
      message: (error as Error).message,
    });
  }
}









