import { MedusaRequest, MedusaResponse, AuthenticatedMedusaRequest } from "@medusajs/framework/http";
import { z } from "zod";
import GiyaPayService from "../../../services/giyapay";
import GiyaPayConfig from "../../../models/giyapay-config";
import GiyaPayTransaction from "../../../models/giyapay-transaction";

// Types for GiyaPay configuration
const GiyaPayConfigSchema = z.object({
  merchantId: z.string(),
  merchantSecret: z.string(),
  sandboxMode: z.boolean(),
  isEnabled: z.boolean().optional().default(true), // Default enabled, but respect user input
});

type GiyaPayConfigInput = z.infer<typeof GiyaPayConfigSchema>;

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  try {
    const container = req.scope
    
    // Try to resolve the GiyaPay service and get config from database
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
      
      const dbConfig = await giyaPayService.getConfigForAPI()
      
      if (dbConfig) {
        // Return the actual config with real secret for editing
        return res.status(200).json({ config: dbConfig })
      }
    } catch (serviceError) {
      console.log('[GiyaPay Config] Service not available, falling back to environment variables')
    }

    // Fallback to environment variables
    const config = {
      merchantId: process.env.GIYAPAY_MERCHANT_ID || "",
      merchantSecret: process.env.GIYAPAY_MERCHANT_SECRET || "",
      sandboxMode: process.env.GIYAPAY_SANDBOX_MODE === 'true',
      isEnabled: !!(process.env.GIYAPAY_MERCHANT_ID && process.env.GIYAPAY_MERCHANT_SECRET),
    };
    
    res.status(200).json({ config });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch GiyaPay configuration",
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
      res.status(400).json({
        error: "Invalid request data",
        details: error.errors,
      });
    } else {
      res.status(500).json({
        error: "Failed to update GiyaPay configuration",
        message: (error as Error).message,
      });
    }
  }
} 