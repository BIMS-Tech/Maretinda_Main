import { defineMiddlewares } from "@medusajs/medusa"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/giyapay/update",
      methods: ["POST", "GET"],
      middlewares: [], // allow without publishable key/auth
    },
  ],
})


