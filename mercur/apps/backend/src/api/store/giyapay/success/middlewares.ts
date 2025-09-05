import { MiddlewareRoute } from "@medusajs/framework/http"

export const middlewares: MiddlewareRoute[] = [
  // No authentication middleware for GiyaPay callbacks
  // GiyaPay calls this endpoint directly without authentication
]