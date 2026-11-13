import { authenticate, defineMiddlewares, errorHandler } from '@medusajs/framework/http'
import type {
  MedusaRequest,
  MedusaResponse,
  MedusaNextFunction,
} from '@medusajs/framework/http'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { PRODUCT_RULE_ATTRIBUTE, productIdsOfSeller } from '../lib/seller-promotion'
import { sellerIdOfMember } from '../lib/seller-ownership'
import { authRateLimit, rateLimit } from '../lib/rate-limit'
import { refusedPromoCode, storedPromoCodes } from '../lib/promotion-metadata'
import { withFreeShippingPrice } from '../lib/free-shipping'
import { uniqueZoneName } from '../lib/unique-zone-name'
import { activePlanOf, hasMarketing, maxProducts, maxStaff, productCount, staffCount } from '../lib/plan-features'
import { SETUP_REQUIRED_CODE, sellerReadiness, setupRequiredMessage } from '../lib/seller-readiness'
import FlashSaleService from '../services/flash-sale'
import { PLAN_REQUIRED_MESSAGE, closedShopMessage, closedShopsSelling, sellersWithoutPlan, vendorRequestNeedsPlan } from '../lib/seller-plan'
import { auditAdminWrites } from '../lib/audit-log'
import { emailReturnUpdates } from '../lib/return-emails'
import { requireCaptcha } from '../lib/captcha'

// A known default signs tokens anyone can forge, including admin ones. Medusa
// falls back to 'supersecret' silently, so refuse to serve traffic instead.
if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'supersecret')
) {
  throw new Error('JWT_SECRET must be set to a private value in production')
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE

/**
 * The product rule is what keeps a seller's promotion on their own items, so it
 * can be narrowed to other owned products but never removed or widened. Lives
 * here rather than in our route because Mercur serves this same URL too.
 */
const guardSellerPromotionRules = async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
  try {
    const db: any = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const sellerId = await sellerIdOfMember(db, (req as any).auth_context?.actor_id)
    if (!sellerId) return res.status(401).json({ message: 'Unauthorized' })

    const promotion: any = await req.scope.resolve(Modules.PROMOTION).retrievePromotion(req.params.id, {
      relations: ['application_method', 'application_method.target_rules'],
    } as any)
    const body = req.body as any
    const productRuleIds = (promotion.application_method?.target_rules ?? [])
      .filter((r: any) => r.attribute === PRODUCT_RULE_ATTRIBUTE)
      .map((r: any) => r.id)
    if ((body?.delete ?? []).some((id: string) => productRuleIds.includes(id))) {
      return res.status(400).json({ message: 'A promotion must stay limited to your own products' })
    }

    const owned = new Set(await productIdsOfSeller(db, sellerId))
    const values = [...(body?.create ?? []), ...(body?.update ?? [])]
      .filter((r: any) => r.attribute === PRODUCT_RULE_ATTRIBUTE || productRuleIds.includes(r.id))
      .flatMap((r: any) => r.values ?? [])
    if (values.some((v: any) => !owned.has(String(v?.value ?? v)))) {
      return res.status(403).json({ message: 'A promotion can only target your own products' })
    }
    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Matches codes ignoring case, and enforces first-order vouchers when applied,
 * not just when collected.
 */
const guardPromoCodes = async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
  try {
    const codes = (req.body as any)?.promo_codes
    if (!Array.isArray(codes) || !codes.length) return next()

    const db: any = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const stored = await storedPromoCodes(db, codes.map(String))
    ;(req.body as any).promo_codes = stored
    if ((req as any).validatedBody?.promo_codes) (req as any).validatedBody.promo_codes = stored

    const cart = await db('cart').where('id', req.params.id).first()
    const refused = await refusedPromoCode(db, stored, cart?.customer_id)
    if (refused) return res.status(400).json({ type: 'invalid_data', message: refused })
    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Every delivery option ships free on carts of ₱499 or more, as the store
 * promises: adds the ₱0 tier to the prices a seller sends, whether they
 * create an option or reprice one. Return options keep their own price.
 */
const addFreeShippingTier = async (req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) => {
  try {
    const body = req.body as any
    if (!Array.isArray(body?.prices)) return next()

    let isReturn = Array.isArray(body.rules) && body.rules.some((r: any) => r.attribute === 'is_return' && String(r.value) === 'true')
    if (!isReturn && req.params?.id) {
      const db: any = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
      const rule = await db('shipping_option_rule')
        .where({ shipping_option_id: req.params.id, attribute: 'is_return' })
        .whereNull('deleted_at')
        .first('value')
      isReturn = rule ? JSON.parse(rule.value) === 'true' || rule.value === 'true' : false
    }
    if (isReturn) return next()

    body.prices = withFreeShippingPrice(body.prices)
    if ((req as any).validatedBody?.prices) (req as any).validatedBody.prices = body.prices
    next()
  } catch (error) {
    next(error)
  }
}

/** And again at completion, in case an order was placed since the code was applied. */
const guardCartPromotions = async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
  try {
    const query: any = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: 'cart',
      fields: ['customer_id', 'promotions.code'],
      filters: { id: req.params.id },
    })
    const cart = data?.[0]
    const codes = (cart?.promotions ?? []).map((p: any) => p?.code).filter(Boolean)

    const db: any = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const refused = await refusedPromoCode(db, codes, cart?.customer_id)
    if (refused) return res.status(400).json({ type: 'invalid_data', message: refused })
    next()
  } catch (error) {
    next(error)
  }
}

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
 * - Public endpoints that cost money or send email are rate limited.
 */
/** Medusa answers these with a 500, but they're the client's mistake. */
const baseErrorHandler = errorHandler()

/** Plan caps and features, as the panel shows them; see lib/plan-features. */
type PlanCheck = (db: any, sellerId: string, plan: NonNullable<Awaited<ReturnType<typeof activePlanOf>>>) =>
  Promise<{ code: 'plan_limit' | 'plan_feature'; message: string } | null>

const planCheck = (check: PlanCheck) => async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
  try {
    if (req.method === 'GET') return next()
    const db: any = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const sellerId = await sellerIdOfMember(db, (req as any).auth_context?.actor_id)
    // No plan at all is the plan gate's answer (requirePlanForVendorChanges)
    const plan = sellerId ? await activePlanOf(db, sellerId) : null
    const refusal = plan && sellerId ? await check(db, sellerId, plan) : null
    if (refusal) return res.status(403).json({ type: 'not_allowed', ...refusal })
    next()
  } catch (error) {
    next(error)
  }
}

const productCap = planCheck(async (db, sellerId, plan) => {
  const max = maxProducts(plan)
  if (max === -1 || (await productCount(db, sellerId)) < max) return null
  return {
    code: 'plan_limit',
    message: `Your ${plan.name} plan allows ${max} product${max === 1 ? '' : 's'}. Upgrade your plan under Subscription to add more.`,
  }
})

const staffCap = planCheck(async (db, sellerId, plan) => {
  const max = maxStaff(plan)
  if (max === -1 || (await staffCount(db, sellerId)) < max) return null
  return {
    code: 'plan_limit',
    message: `Your ${plan.name} plan includes ${max} staff account${max === 1 ? '' : 's'}. Upgrade your plan under Subscription to invite more.`,
  }
})

const marketingFeature = (feature: string) =>
  planCheck(async (_db, _sellerId, plan) =>
    hasMarketing(plan)
      ? null
      : { code: 'plan_feature', message: `${feature} come with the Growth and Premium plans. Upgrade under Subscription to use them.` }
  )

/**
 * Store setup must be finished before a shop goes public; see
 * lib/seller-readiness. `when` narrows it to the requests that would.
 */
const requireReadyShop = (action: string, when: (req: MedusaRequest) => boolean = () => true) =>
  async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
    try {
      if (req.method === 'GET' || !when(req)) return next()
      const db: any = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
      const sellerId = await sellerIdOfMember(db, (req as any).auth_context?.actor_id)
      const seller = sellerId ? await db('seller').where('id', sellerId).first() : null
      if (!seller) return next()
      const { ready, missing } = sellerReadiness(seller)
      if (!ready) {
        return res.status(403).json({ type: 'not_allowed', code: SETUP_REQUIRED_CODE, message: setupRequiredMessage(action, missing), missing })
      }
      next()
    } catch (error) {
      next(error)
    }
  }

// Sellers put a product up for sale by proposing it (Mercur then publishes it)
const publishing = (req: MedusaRequest) => ['proposed', 'published'].includes((req.body as any)?.status)

/** Zone names are unique marketplace-wide; see lib/unique-zone-name. */
const uniqueZoneNameFor = (table: 'fulfillment_set' | 'service_zone') =>
  async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
    try {
      const body = req.body as any
      if (typeof body?.name !== 'string' || !body.name.trim()) return next()
      const db: any = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
      const sellerId = await sellerIdOfMember(db, (req as any).auth_context?.actor_id)
      const seller = sellerId ? await db('seller').where('id', sellerId).first('handle') : null
      if (!seller?.handle) return next()
      const name = await uniqueZoneName(db, table, body.name.trim(), seller.handle)
      body.name = name
      if ((req as any).validatedBody) (req as any).validatedBody.name = name
      next()
    } catch (error) {
      next(error)
    }
  }

/** The panel's subscription gate, held by the API too. See lib/seller-plan. */
const requirePlanForVendorChanges = async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
  try {
    if (!vendorRequestNeedsPlan(req.method, (req.originalUrl ?? req.url).split('?')[0])) return next()
    const db: any = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const sellerId = await sellerIdOfMember(db, (req as any).auth_context?.actor_id)
    if (sellerId && (await sellersWithoutPlan(db, [sellerId])).length) {
      return res.status(403).json({ type: 'not_allowed', code: 'plan_required', message: PLAN_REQUIRED_MESSAGE })
    }
    next()
  } catch (error) {
    next(error)
  }
}

/** A shop without a plan is closed: its products can't go in a cart or be checked out. */
const refuseClosedShopItems = (productIdsOf: (db: any, req: MedusaRequest) => Promise<string[]>) =>
  async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
    try {
      const db: any = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
      const closed = await closedShopsSelling(db, await productIdsOf(db, req))
      if (closed.length) {
        return res.status(400).json({ type: 'not_allowed', code: 'shop_closed', message: closedShopMessage(closed) })
      }
      next()
    } catch (error) {
      next(error)
    }
  }

/**
 * Flash-sale units are claimed at checkout, not when they go in a cart, so
 * an abandoned cart can't sell out a sale. Refuses the checkout when the sale
 * no longer has the units; the scheduled recount gives back any claimed by a
 * checkout that then failed.
 */
const claimFlashSaleStock = async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
  try {
    const db: any = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const lines = await db('cart_line_item')
      .where('cart_id', req.params.id)
      .whereNull('deleted_at')
      .whereRaw("metadata->>'flash_sale_item_id' IS NOT NULL")
      .select('title', 'quantity', db.raw("metadata->>'flash_sale_item_id' AS item_id"))
    const wanted = new Map<string, { units: number; title: string }>()
    for (const l of lines) {
      const w = wanted.get(l.item_id) ?? { units: 0, title: l.title }
      w.units += Number(l.quantity)
      wanted.set(l.item_id, w)
    }
    const service = new FlashSaleService(req.scope as any)
    const claimed: [string, number][] = []
    for (const [itemId, { units, title }] of wanted) {
      if (!(await service.reserveStock(itemId, units))) {
        for (const [id, n] of claimed) await service.incrementSoldCount(id, -n)
        return res.status(400).json({
          type: 'not_allowed',
          code: 'flash_sale_sold_out',
          message: `The flash sale for ${title} has sold out. Remove it from your cart and add it again at the regular price.`,
        })
      }
      claimed.push([itemId, units])
    }
    next()
  } catch (error) {
    next(error)
  }
}

/**
 * A seller declining ("withdrawn") or escalating a buyer's return. Mercur's
 * route runs a workflow that links the order's returns to the seller and
 * crashes when there are none, which is every time before a refund, so those
 * two answers are saved here. Refunds still go through Mercur: they open the
 * return that its linking needs.
 */
const answerReturnWithoutRefund = async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
  try {
    const { status, vendor_reviewer_note } = (req.body ?? {}) as { status?: string; vendor_reviewer_note?: unknown }
    if (status !== 'withdrawn' && status !== 'escalated') return next()
    if (typeof vendor_reviewer_note !== 'string') {
      return res.status(400).json({ type: 'invalid_data', message: 'Add a note for the buyer' })
    }
    const db: any = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const sellerId = await sellerIdOfMember(db, (req as any).auth_context?.actor_id)
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: 'order_return_request',
      fields: ['id', 'status', 'seller.id'],
      filters: { id: req.params.id },
    })
    const request: any = data[0]
    if (!request || !sellerId || request.seller?.id !== sellerId) {
      return res.status(404).json({ type: 'not_found', message: 'Return request not found' })
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ type: 'invalid_data', message: 'This return has already been answered' })
    }
    const [order_return_request] = await (req.scope.resolve('order_return') as any).updateOrderReturnRequests([
      {
        id: request.id,
        status,
        vendor_reviewer_note,
        vendor_reviewer_id: (req as any).auth_context?.actor_id,
        vendor_review_date: new Date(),
      },
    ])
    res.json({ order_return_request })
  } catch (error) {
    next(error)
  }
}

const productOfAddedVariant = async (db: any, req: MedusaRequest) => {
  const variantId = (req.body as any)?.variant_id
  if (!variantId) return []
  const variant = await db('product_variant').where('id', variantId).whereNull('deleted_at').first('product_id')
  return variant ? [variant.product_id] : []
}

const productsInCart = async (db: any, req: MedusaRequest) =>
  (await db('cart_line_item').where('cart_id', req.params.id).whereNull('deleted_at').whereNotNull('product_id').distinct('product_id'))
    .map((r: any) => r.product_id)

export default defineMiddlewares({
  errorHandler: (error: any, req: any, res: any, next: any) => {
    if (error?.type === 'entity.parse.failed') {
      return res.status(400).json({ type: 'invalid_data', message: 'Request body is not valid JSON' })
    }
    if (error?.type === 'entity.too.large') {
      return res.status(413).json({ type: 'invalid_data', message: 'Request body is too large' })
    }
    return baseErrorHandler(error, req, res, next)
  },
  routes: [
    {
      matcher: '/webhooks/flyingtigers',
      method: ['POST'],
      bodyParser: { preserveRawBody: true },
    },
    {
      matcher: '/webhooks/ninjavan',
      method: ['POST'],
      bodyParser: { preserveRawBody: true },
    },
    { matcher: '/auth/*', middlewares: [authRateLimit] },
    { matcher: '/auth/customer/emailpass/register', method: ['POST'], middlewares: [requireCaptcha] },
    { matcher: '/admin/*', middlewares: [auditAdminWrites] },
    {
      matcher: '/store/seller-application',
      method: ['POST'],
      middlewares: [rateLimit({ name: 'seller-application', max: 5, windowMs: HOUR }), requireCaptcha],
    },
    {
      matcher: '/store/uploads',
      method: ['POST'],
      middlewares: [rateLimit({ name: 'public-upload', max: 30, windowMs: HOUR })],
    },
    {
      matcher: '/store/vendor/register',
      method: ['POST'],
      middlewares: [rateLimit({ name: 'vendor-register', max: 10, windowMs: HOUR })],
    },
    {
      matcher: '/store/newsletter',
      method: ['POST'],
      middlewares: [rateLimit({ name: 'newsletter', max: 10, windowMs: HOUR })],
    },
    {
      matcher: '/store/reports',
      method: ['POST'],
      middlewares: [rateLimit({ name: 'listing-report', max: 10, windowMs: HOUR })],
    },
    {
      matcher: '/store/chat',
      method: ['POST'],
      middlewares: [rateLimit({ name: 'chat-start', max: 20, windowMs: HOUR })],
    },
    {
      matcher: '/store/reviews',
      method: ['POST'],
      middlewares: [rateLimit({ name: 'review', max: 20, windowMs: HOUR })],
    },
    {
      matcher: '/store/reels/:id/view',
      method: ['POST'],
      middlewares: [
        rateLimit({ name: 'reel-view', max: 10, windowMs: MINUTE, key: (req) => req.params?.id }),
      ],
    },
    {
      matcher: '/store/calculate-shipping',
      middlewares: [rateLimit({ name: 'shipping-quote', max: 60, windowMs: MINUTE })],
    },
    {
      matcher: '/giyapay/*',
      method: ['POST'],
      middlewares: [rateLimit({ name: 'giyapay', max: 60, windowMs: MINUTE })],
    },
    {
      matcher: '/vendor/promotions/:id/target-rules/batch',
      method: ['POST'],
      middlewares: [guardSellerPromotionRules],
    },
    { matcher: '/vendor/shipping-options', method: ['POST'], middlewares: [addFreeShippingTier] },
    { matcher: '/vendor/shipping-options/:id', method: ['POST'], middlewares: [addFreeShippingTier] },
    { matcher: '/store/carts/:id', method: ['POST'], middlewares: [guardPromoCodes] },
    { matcher: '/store/carts/:id/promotions', method: ['POST'], middlewares: [guardPromoCodes] },
    { matcher: '/store/carts/:id/complete', method: ['POST'], middlewares: [refuseClosedShopItems(productsInCart), guardCartPromotions, claimFlashSaleStock] },
    { matcher: '/store/carts/:id/line-items', method: ['POST'], middlewares: [refuseClosedShopItems(productOfAddedVariant)] },
    { matcher: '/vendor/*', middlewares: [requirePlanForVendorChanges] },
    { matcher: '/vendor/products', method: ['POST'], middlewares: [productCap, requireReadyShop('publish products', publishing)] },
    { matcher: '/vendor/products/:id/status', method: ['POST'], middlewares: [requireReadyShop('publish products', publishing)] },
    { matcher: '/vendor/products/import', method: ['POST'], middlewares: [productCap, requireReadyShop('import products')] },
    { matcher: '/vendor/invites', method: ['POST'], middlewares: [staffCap] },
    { matcher: '/store/return-request', method: ['POST'], middlewares: [emailReturnUpdates] },
    { matcher: '/admin/return-request/:id', method: ['POST'], middlewares: [emailReturnUpdates] },
    { matcher: '/vendor/return-request/:id', method: ['POST'], middlewares: [emailReturnUpdates, answerReturnWithoutRefund] },
    { matcher: '/vendor/reels', method: ['POST'], middlewares: [requireReadyShop('post reels')] },
    { matcher: '/vendor/flash-sales/*', middlewares: [marketingFeature('Flash sales'), requireReadyShop('join flash sales')] },
    { matcher: '/vendor/promotions', middlewares: [marketingFeature('Promotions and vouchers'), requireReadyShop('run promotions and vouchers')] },
    { matcher: '/vendor/promotions/*', middlewares: [marketingFeature('Promotions and vouchers'), requireReadyShop('run promotions and vouchers')] },
    { matcher: '/vendor/campaigns', middlewares: [marketingFeature('Campaigns'), requireReadyShop('run campaigns')] },
    { matcher: '/vendor/campaigns/*', middlewares: [marketingFeature('Campaigns'), requireReadyShop('run campaigns')] },
    { matcher: '/vendor/stock-locations/:id/fulfillment-sets', method: ['POST'], middlewares: [uniqueZoneNameFor('fulfillment_set')] },
    { matcher: '/vendor/fulfillment-sets/:id/service-zones', method: ['POST'], middlewares: [uniqueZoneNameFor('service_zone')] },
    { matcher: '/store/account', middlewares: [authenticate('customer', ['bearer', 'session'])] },
    { matcher: '/store/account/*', middlewares: [authenticate('customer', ['bearer', 'session'])] },
    { matcher: '/store/seller', method: ['GET'], middlewares: [enrichSellerVerification] },
    { matcher: '/store/seller/*', method: ['GET'], middlewares: [enrichSellerVerification] },
    { matcher: '/store/products', method: ['GET'], middlewares: [enrichSellerVerification] },
    { matcher: '/store/products/*', method: ['GET'], middlewares: [enrichSellerVerification] },
  ],
})
