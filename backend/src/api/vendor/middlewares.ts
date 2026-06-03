import { defineMiddlewares } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createPromotionsWorkflow } from "@medusajs/core-flows"
import { NextFunction, Request, Response } from "express"

function restorePaymentCollectionsFields(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const queryConfig = (req as any).queryConfig
  if (queryConfig?.fields) {
    const hasPaymentCollections = queryConfig.fields.some((f: string) =>
      f.includes("payment_collections")
    )
    if (!hasPaymentCollections) {
      queryConfig.fields = [...queryConfig.fields, "*payment_collections.payments"]
    }
  }
  next()
}

/**
 * Intercept POST /vendor/promotions — mercurjs's VendorCreatePromotion validator
 * only allows type:'percentage' + target_type:'items'. We bypass it to support
 * all promotion types (fixed, percentage) and target types (order, items).
 */
async function promotionCreateOverride(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.method !== "POST") return next()

  try {
    const memberId = (req as any).auth_context?.actor_id
    if (!memberId) return res.status(401).json({ message: "Unauthorized" })

    const pg = (req as any).scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const sellerRow = await pg.raw(
      `SELECT seller_id FROM member WHERE id = ? LIMIT 1`,
      [memberId]
    )
    const sellerId = sellerRow.rows?.[0]?.seller_id
    if (!sellerId) return res.status(401).json({ message: "Unauthorized" })

    const body = req.body as any

    const { result } = await createPromotionsWorkflow((req as any).scope).run({
      input: { promotionsData: [body] },
    })

    const promotion = Array.isArray(result) ? result[0] : result

    await pg.raw(
      `INSERT INTO seller_seller_promotion_promotion (id, seller_id, promotion_id)
       VALUES (gen_random_uuid(), ?, ?)
       ON CONFLICT (seller_id, promotion_id) DO NOTHING`,
      [sellerId, promotion.id]
    )

    return res.status(201).json({ promotion })
  } catch (error: any) {
    console.error("[VendorPromotionCreate] Error:", error.message)
    return res.status(400).json({ message: error.message })
  }
}

/**
 * Intercept GET /vendor/campaigns — mercurjs applies filterBySellerId which
 * restricts to seller-owned campaigns only (platform campaigns are excluded),
 * and also rejects object query params like `budget=[object Object]`.
 * We bypass both by handling the request directly.
 */
async function campaignListOverride(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const promotionService = (req as any).scope.resolve(Modules.PROMOTION)
    const query = req.query as any
    const limit = parseInt(query.limit || "20", 10)
    const offset = parseInt(query.offset || "0", 10)

    const [campaigns, count] = await (promotionService as any).listAndCountCampaigns(
      {},
      {
        relations: ["promotions", "budget"],
        skip: offset,
        take: limit,
      } as any
    )

    return res.status(200).json({ campaigns, count, limit, offset })
  } catch {
    next()
  }
}

/**
 * Intercept GET /vendor/campaigns/:id — mercurjs checks seller_campaign link
 * ownership, which blocks platform campaigns (created by admin, not seller).
 * We bypass by reading the campaign directly.
 */
async function campaignDetailOverride(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params
    const promotionService = (req as any).scope.resolve(Modules.PROMOTION)

    const campaign = await (promotionService as any).retrieveCampaign(id, {
      relations: ["promotions", "budget"],
    } as any)

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" })
    }

    return res.status(200).json({ campaign })
  } catch {
    next()
  }
}

/**
 * Override rule-value-options for customer_group and product_category.
 * The mercurjs handler filters customer_group by seller-specific links which
 * returns empty for platform groups. We query the DB directly instead.
 */
async function ruleValueOptionsOverride(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { ruleValue, rule_attribute_id } = req.params as any
  const attribute = ruleValue || rule_attribute_id

  if (attribute === "customer_group") {
    try {
      const knex = (req as any).scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
      const result = await knex.raw(
        `SELECT id, name FROM customer_group WHERE deleted_at IS NULL ORDER BY name ASC LIMIT 200`
      )
      return res.status(200).json({
        values: (result.rows || []).map((g: any) => ({ value: g.id, label: g.name })),
      })
    } catch {
      return next()
    }
  }

  if (attribute === "product_category") {
    try {
      const knex = (req as any).scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
      const result = await knex.raw(
        `SELECT id, name FROM product_category WHERE deleted_at IS NULL ORDER BY name ASC LIMIT 500`
      )
      return res.status(200).json({
        values: (result.rows || []).map((c: any) => ({ value: c.id, label: c.name })),
      })
    } catch {
      return next()
    }
  }

  next()
}

export default defineMiddlewares({
  routes: [
    {
      method: ["GET"],
      matcher: "/vendor/orders",
      middlewares: [restorePaymentCollectionsFields],
    },
    {
      method: ["GET"],
      matcher: "/vendor/orders/:id",
      middlewares: [restorePaymentCollectionsFields],
    },
    {
      method: ["POST"],
      matcher: "/vendor/promotions",
      middlewares: [promotionCreateOverride],
    },
    {
      method: ["GET"],
      matcher: "/vendor/campaigns",
      middlewares: [campaignListOverride],
    },
    {
      method: ["GET"],
      matcher: "/vendor/campaigns/:id",
      middlewares: [campaignDetailOverride],
    },
    {
      method: ["GET"],
      matcher: "/vendor/promotions/rule-value-options/:ruleType/:ruleValue",
      middlewares: [ruleValueOptionsOverride],
    },
    {
      method: ["GET"],
      matcher: "/vendor/promotions/rule-value-options/:rule_type/:rule_attribute_id",
      middlewares: [ruleValueOptionsOverride],
    },
  ],
})
