import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    // Test if we can access basic functionality
    res.status(200).json({
      message: "GiyaPay test endpoint working",
      timestamp: new Date().toISOString(),
      container_keys: Object.keys(req.scope || {}).filter(key => key.includes('giya') || key.includes('Giya')),
    });
  } catch (error) {
    console.error("GiyaPay test error:", error);
    res.status(500).json({
      error: "GiyaPay test failed",
      message: (error as Error).message,
    });
  }
}