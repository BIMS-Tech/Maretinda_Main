import { defineMiddlewares, authenticate } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      // Bearer token required but allowUnregistered=true so tokens without
      // actor_id (unlinked Google auth identities) are accepted
      matcher: "/store/auth/link-google",
      method: ["POST"],
      middlewares: [
        authenticate("customer", "bearer", { allowUnregistered: true }),
      ],
    },
  ],
})
