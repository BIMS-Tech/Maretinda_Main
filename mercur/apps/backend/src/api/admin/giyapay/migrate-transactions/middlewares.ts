import { defineMiddlewares } from "@medusajs/medusa"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/giyapay/migrate-transactions",
      middlewares: [], // No authentication required for migration
    },
  ],
})











