import { defineMiddlewares } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
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
 * Intercepts vendor promotion create/update requests and automatically
 * injects seller_id, seller_name, and scope="seller" into metadata.
 * This ensures every vendor promotion is correctly tagged without
 * requiring the vendor to set this manually in the UI.
 */
async function injectSellerPromotionMetadata(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!["POST", "PUT"].includes(req.method)) return next()

  const memberId = (req as any).auth_context?.actor_id
  if (!memberId) return next()

  try {
    const knex = (req as any).scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

    // Look up seller from member record
    const memberResult = await knex.raw(
      `SELECT m.seller_id, s.name as seller_name
       FROM member m
       LEFT JOIN seller s ON s.id = m.seller_id
       WHERE m.id = ? LIMIT 1`,
      [memberId]
    )

    const member = memberResult.rows?.[0]
    if (!member?.seller_id) return next()

    // Inject seller metadata into the request body
    req.body = req.body || {}
    req.body.metadata = {
      ...(req.body.metadata || {}),
      scope: "seller",
      seller_id: member.seller_id,
      seller_name: member.seller_name || "Seller",
      is_public: true,
    }
  } catch {
    // Non-blocking: if lookup fails, proceed without injecting
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
      method: ["POST", "PUT"],
      matcher: "/vendor/promotions*",
      middlewares: [injectSellerPromotionMetadata],
    },
  ],
})
