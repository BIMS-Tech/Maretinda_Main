import { defineMiddlewares } from '@medusajs/framework/http'
import type {
  MedusaRequest,
  MedusaResponse,
  MedusaNextFunction,
} from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * Collect every seller object present in a store response body, across the
 * shapes the storefront uses: { seller }, { sellers: [] }, { product: { seller } },
 * { products: [{ seller }] }.
 */
function collectSellers(body: any): any[] {
  const out: any[] = []
  const push = (s: any) => {
    if (s && typeof s === 'object' && typeof s.id === 'string') out.push(s)
  }
  if (!body || typeof body !== 'object') return out
  push(body.seller)
  if (Array.isArray(body.sellers)) body.sellers.forEach(push)
  push(body.product?.seller)
  if (Array.isArray(body.products)) body.products.forEach((p: any) => push(p?.seller))
  return out
}

/**
 * verification_status lives on the seller table but is NOT part of the Mercur
 * seller module model, so query.graph (used by all store endpoints) can't return
 * it. Enrich the response with it via raw knex so the storefront can render the
 * "Verified" badge only for admin-verified sellers.
 */
const enrichSellerVerification = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const originalJson = res.json.bind(res)
  ;(res as any).json = (body: any) => {
    const sellers = collectSellers(body)
    if (!sellers.length) return originalJson(body)

    return (async () => {
      try {
        const db: any = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
        const ids = [...new Set(sellers.map((s) => s.id))]
        const rows = await db('seller')
          .whereIn('id', ids)
          .select('id', 'verification_status')
        const map = new Map<string, string>(
          rows.map((r: any) => [r.id, r.verification_status || 'unverified'])
        )
        for (const s of sellers) {
          s.verification_status = map.get(s.id) ?? 'unverified'
        }
      } catch {
        // best-effort — never block the response over the badge
      }
      return originalJson(body)
    })()
  }
  next()
}

/**
 * Global API middlewares.
 *
 * - Webhook routes need the raw, unparsed request body to verify HMAC signatures.
 * - Store seller/product responses are enriched with seller verification_status.
 */
export default defineMiddlewares({
  routes: [
    {
      matcher: '/webhooks/flyingtigers',
      method: ['POST'],
      bodyParser: { preserveRawBody: true },
    },
    { matcher: '/store/seller', method: ['GET'], middlewares: [enrichSellerVerification] },
    { matcher: '/store/seller/*', method: ['GET'], middlewares: [enrichSellerVerification] },
    { matcher: '/store/products', method: ['GET'], middlewares: [enrichSellerVerification] },
    { matcher: '/store/products/*', method: ['GET'], middlewares: [enrichSellerVerification] },
  ],
})
