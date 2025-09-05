import { MiddlewareRoute } from '@medusajs/framework'
import { validateAndTransformBody } from '@medusajs/framework'
import { z } from 'zod'

const DftGenerationCreateSchema = z.object({
  seller_ids: z.array(z.string()).optional(),
  payout_ids: z.array(z.string()).optional(),
  date_range: z.object({
    from: z.string().datetime(),
    to: z.string().datetime()
  }).optional(),
  currency: z.string().default("PHP"),
  notes: z.string().optional()
})

const DftGenerateSchema = z.object({
  seller_ids: z.array(z.string()).optional(),
  include_all_pending: z.boolean().default(false),
  date_range: z.object({
    from: z.string().datetime(),
    to: z.string().datetime()
  }).optional(),
  source_account: z.string().optional(),
  notes: z.string().optional()
})

export const adminDftMiddlewares: MiddlewareRoute[] = [
  {
    method: ['POST'],
    matcher: '/admin/dft',
    middlewares: [validateAndTransformBody(DftGenerationCreateSchema)]
  },
  {
    method: ['POST'],
    matcher: '/admin/dft/generate',
    middlewares: [validateAndTransformBody(DftGenerateSchema)]
  }
]
