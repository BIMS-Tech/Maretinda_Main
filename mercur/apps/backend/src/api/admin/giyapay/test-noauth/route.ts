import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import GiyaPayService from "../../../../services/giyapay";
import GiyaPayConfig from "../../../../models/giyapay-config";
import GiyaPayTransaction from "../../../../models/giyapay-transaction";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    // Test our service without authentication
    const giyaPay = new GiyaPayService({
      giyapayConfigRepository: (req.scope.resolve("manager") as any).getRepository("GiyaPayConfig"),
      giyapayTransactionRepository: (req.scope.resolve("manager") as any).getRepository("GiyaPayTransaction")
    });
    
    // Try to get configuration from database
    const config = await giyaPay.getConfig();
    
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
    });
  }
}