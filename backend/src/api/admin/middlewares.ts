import { defineMiddlewares, authenticate } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/reports*",
      middlewares: [authenticate("user", ["session", "bearer", "api_key"], { allowUnregistered: false })],
    },
    {
      matcher: "/admin/talk-js*",
      middlewares: [authenticate("user", ["session", "bearer", "api_key"], { allowUnregistered: false })],
    },
    {
      matcher: "/admin/settlement*",
      middlewares: [authenticate("user", ["session", "bearer", "api_key"], { allowUnregistered: false })],
    },
    {
      matcher: "/admin/dft*",
      middlewares: [authenticate("user", ["session", "bearer", "api_key"], { allowUnregistered: false })],
    },
    {
      matcher: "/admin/tama*",
      middlewares: [authenticate("user", ["session", "bearer", "api_key"], { allowUnregistered: false })],
    },
  ],
})

