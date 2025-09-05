import { MiddlewareRoute } from "@medusajs/framework/http";
import { 
  validateAndTransformBody,
} from "@medusajs/framework";
import { z } from "zod";

// Schema for GiyaPay configuration
const AdminPostGiyaPayConfigReq = z.object({
  merchantId: z.string(),
  merchantSecret: z.string(), 
  sandboxMode: z.boolean(), // No default - respect user input
  isEnabled: z.boolean().optional().default(true), // Default enabled
});

export const adminGiyaPayMiddlewares: MiddlewareRoute[] = [
  {
    method: "POST",
    matcher: "/admin/giyapay",
    middlewares: [
      validateAndTransformBody(AdminPostGiyaPayConfigReq),
    ],
  },
];