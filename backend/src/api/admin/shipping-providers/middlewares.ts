import { defineMiddlewares, authenticate } from "@medusajs/framework/http"

export const config = defineMiddlewares([
  {
    matcher: "/admin/shipping-providers",
    middlewares: [authenticate("admin", ["bearer", "session"])],
  },
])
