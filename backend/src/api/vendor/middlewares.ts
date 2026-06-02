import { defineMiddlewares } from "@medusajs/framework/http"
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
