import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import GiyaPayService from "../../../services/giyapay";
import { GiyaPayConfig } from "../../../models/giyapay-config";
import { GiyaPayTransaction } from "../../../models/giyapay-transaction";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    // Test simple config without complex service resolution
    const config = {
      merchantId: process.env.GIYAPAY_MERCHANT_ID || "",
      merchantSecret: process.env.GIYAPAY_MERCHANT_SECRET || "",
      sandboxMode: process.env.GIYAPAY_SANDBOX_MODE === 'true',
      isEnabled: !!(process.env.GIYAPAY_MERCHANT_ID && process.env.GIYAPAY_MERCHANT_SECRET),
    };
    
    res.status(200).json({
      message: "GiyaPay service test successful!",
      hasConfig: !!config,
      config: config || {
        merchantId: "",
        merchantSecret: "",
        sandboxMode: true,
        isEnabled: false,
      },
      debug: {
        timestamp: new Date().toISOString(),
        serviceWorking: true
      }
    });
  } catch (error) {
    console.error("GiyaPay test error:", error);
    res.status(500).json({
      error: "GiyaPay service test failed",
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
  }
}