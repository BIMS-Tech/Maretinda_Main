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
    {
      matcher: "/store/chat*",
      middlewares: [authenticate("customer", "bearer", { allowUnregistered: false })],
    },
    // Reels are public to read — only the like toggle needs a customer. GET
    // /store/reels* resolves the viewer opportunistically via getOptionalCustomerId,
    // and messaging a seller goes through the existing /store/chat routes.
    {
      matcher: "/store/reels/*/like",
      method: ["POST"],
      middlewares: [authenticate("customer", "bearer", { allowUnregistered: false })],
    },
  ],
})
