import { defineMiddlewares } from "@medusajs/framework/http"
import { NextFunction, Request, Response } from "express"

/**
 * The @mercurjs/b2c-core plugin's transformPaymentFilters middleware strips
 * payment_collections fields and replaces them with split_order_payment.*.
 * This middleware runs after the plugin's middleware and adds
 * payment_collections.payments back so the frontend can detect COD orders
 * by checking for provider_id === "pp_system_default".
 */
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
  ],
})
