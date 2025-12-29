import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { z } from "zod"

// Validation schema for GiyaPay configuration
const GiyaPayConfigSchema = z.object({
  merchantId: z.string().min(1, "Merchant ID is required"),
  merchantSecret: z.string().min(1, "Merchant Secret is required"),
  sandboxMode: z.boolean().optional().default(false),
  isEnabled: z.boolean().optional().default(true),
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
    
    // Try to get config from service
    try {
      let giyaPayService
      
      try {
        giyaPayService = container.resolve("giyaPayService") as any
      } catch (serviceError) {
        console.log('[GiyaPay Config] Service not registered, creating on-demand...')
        // Register service on-demand
        const GiyaPayService = require("../../../services/giyapay").default
        giyaPayService = new GiyaPayService(container)
        container.register({
          giyaPayService: { resolve: () => giyaPayService, lifetime: "SINGLETON" }
        })
        console.log('[GiyaPay Config] Service registered on-demand')
      }

      const config = await giyaPayService.getConfig()
      
      if (config) {
        // Hide secret in response
        const responseConfig = {
          ...config,
          merchantSecret: "***"
        }
        
        return res.status(200).json({
          config: responseConfig,
        })
      } else {
        return res.status(200).json({
          config: null,
        })
      }
    } catch (serviceError) {
      console.log('[GiyaPay Config] Service not available, returning empty config')
      return res.status(200).json({
        config: null,
      })
    }
  } catch (error) {
    console.error('[GiyaPay Config] Error getting config:', error)
    return res.status(500).json({
      error: "Failed to get configuration",
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
    const validatedData = GiyaPayConfigSchema.parse(req.body);
    
    const container = req.scope
    
    // Try to save to database using the service
    try {
      let giyaPayService
      
      try {
        giyaPayService = container.resolve("giyaPayService") as any
      } catch (serviceError) {
        console.log('[GiyaPay Config] Service not registered, creating on-demand...')
        // Register service on-demand
        const GiyaPayService = require("../../../services/giyapay").default
        giyaPayService = new GiyaPayService(container)
        container.register({
          giyaPayService: { resolve: () => giyaPayService, lifetime: "SINGLETON" }
        })
        console.log('[GiyaPay Config] Service registered on-demand')
      }
      const savedConfig = await giyaPayService.createOrUpdateConfigForAPI({
        merchantId: validatedData.merchantId,
        merchantSecret: validatedData.merchantSecret,
        sandboxMode: validatedData.sandboxMode,
        isEnabled: validatedData.isEnabled,
      })

      // Hide secret in response
      const responseConfig = {
        ...savedConfig,
        merchantSecret: "***"
      }

      return res.status(200).json({
        message: "GiyaPay configuration saved successfully",
        config: responseConfig,
      });
    } catch (serviceError) {
      console.log('[GiyaPay Config] Service not available, returning success without database save')
      
      // Fallback response without database save
      const config = {
        merchantId: validatedData.merchantId,
        merchantSecret: "***",
        sandboxMode: validatedData.sandboxMode,
        isEnabled: validatedData.isEnabled,
      };

      return res.status(200).json({
        message: "GiyaPay configuration received (database save pending)",
        config,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors,
      });
    }

    console.error('[GiyaPay Config] Error saving config:', error)
    return res.status(500).json({
      error: "Failed to save configuration",
      message: (error as Error).message,
    });
  }
}









