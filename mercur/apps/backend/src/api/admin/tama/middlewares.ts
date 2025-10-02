import { 
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { z } from "zod"

// Validation schema for creating TAMA generation
export const AdminCreateTamaGenerationSchema = z.object({
  date_range: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }).optional(),
  funding_account: z.string().min(1, "Funding account is required"),
  notes: z.string().optional(),
}).strict()

// Validation schema for listing TAMA generations
export const AdminListTamaGenerationsSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
}).strict()

// Middleware routes configuration
export const adminTamaMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/admin/tama",
    middlewares: [
      validateAndTransformBody(AdminCreateTamaGenerationSchema),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/tama",
    middlewares: [
      validateAndTransformQuery(AdminListTamaGenerationsSchema),
    ],
  },
]


