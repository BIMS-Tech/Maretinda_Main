import { defineMiddlewares } from '@medusajs/framework/http'

/**
 * Global API middlewares.
 *
 * Webhook routes need the raw, unparsed request body so we can verify the
 * provider's HMAC signature over the exact bytes that were signed. Medusa's
 * body parser normally discards the raw buffer, so we opt these routes into
 * `preserveRawBody`, which exposes it as `req.rawBody`.
 */
export default defineMiddlewares({
  routes: [
    {
      matcher: '/webhooks/flyingtigers',
      method: ['POST'],
      bodyParser: { preserveRawBody: true },
    },
  ],
})
